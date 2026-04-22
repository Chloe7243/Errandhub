import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import {
  helperAcceptErrand,
  helperCounterOffer,
  helperDeclineErrand,
  requestOfferResponse,
} from "../services/matching";
import { prisma } from "./prisma";
import { notifyUser } from "./notifications";

let io: Server | null = null;

// Stores all active socket IDs per user so multiple tabs/devices are handled
// correctly. A user is only considered offline when their last socket disconnects.
type UserSocketEntry = {
  socketIds: Set<string>;
  role: string;
  coordinates?: { lat: number; lng: number };
};

const userSockets = new Map<string, UserSocketEntry>();

/**
 * Initialise the Socket.IO server and wire up all realtime handlers.
 *
 * Mounts onto the existing HTTP server, verifies JWTs on the handshake,
 * tracks one entry per user with a Set of socketIds (supports multiple
 * devices/tabs), and handles: chat messages, errand rooms, helper matching
 * responses (accept/decline/counter-offer), requester counter-offer
 * replies, and in-memory helper location updates. Returns the Socket.IO
 * Server instance so callers can attach additional namespaces if needed.
 */
export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Unauthorised"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        userId: string;
        role: string;
      };
      socket.data.userId = decoded.userId;
      socket.data.role = decoded.role;
      next();
    } catch {
      next(new Error("Unauthorised"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const { userId, role } = socket.data;
    console.log("User connected:", userId, role, `(socketId: ${socket.id})`);

    const existing = userSockets.get(userId);
    if (existing) {
      existing.socketIds.add(socket.id);
    } else {
      userSockets.set(userId, { socketIds: new Set([socket.id]), role });
    }

    // Errand rooms are used for chat only. Matching events are sent directly to
    // userSockets (via emitToUser) so they reach the right user regardless of which
    // room they are currently in.
    socket.on("join_room", (errandId: string) => {
      socket.join(errandId);
    });

    socket.on(
      "send_message",
      async ({
        errandId,
        content,
        imageUrl,
      }: {
        errandId: string;
        content?: string;
        imageUrl?: string;
      }) => {
        if (!content && !imageUrl) return;

        const message = {
          id: Date.now().toString(),
          errandId,
          senderId: userId,
          content,
          imageUrl,
          createdAt: new Date().toISOString(),
        };

        const errand = await prisma.errand.findUnique({
          where: { id: errandId },
          select: { requesterId: true, helperId: true },
        });

        if (errand) {
          // Deliver to both parties via emitToUser (not io.to(room)) so the message
          // reaches all of a user's connected devices, not just the room socket.
          emitToUser(errand.requesterId, "receive_message", message);
          if (errand.helperId) {
            emitToUser(errand.helperId, "receive_message", message);
          }

          // Push-notify the other participant (not the sender).
          const recipientId =
            userId === errand.requesterId
              ? errand.helperId
              : errand.requesterId;

          if (recipientId) {
            const sender = await prisma.user.findUnique({
              where: { id: userId },
              select: { firstName: true },
            });
            const senderName = sender?.firstName ?? "Someone";
            const preview = content
              ? content.length > 60
                ? content.slice(0, 57) + "..."
                : content
              : "Sent an image";

            await notifyUser(recipientId, {
              title: `${senderName} sent a message`,
              body: preview,
              data: { type: "message", errandId },
            });
          }
        } else {
          // Errand not found — fall back to room broadcast so the message still arrives.
          io?.to(errandId).emit("receive_message", message);
        }
      },
    );

    socket.on("accept_errand", async ({ errandId }: { errandId: string }) => {
      if (role !== "helper") return;
      await helperAcceptErrand(errandId, userId);
    });

    socket.on("decline_errand", async ({ errandId }: { errandId: string }) => {
      if (role !== "helper") return;
      await helperDeclineErrand(errandId, userId);
    });

    socket.on(
      "counter_offer",
      async ({ errandId, amount }: { errandId: string; amount: number }) => {
        if (role !== "helper") return;
        await helperCounterOffer(errandId, userId, amount);
      },
    );

    socket.on(
      "offer_response",
      async ({ errandId, accept }: { errandId: string; accept: boolean }) => {
        if (role !== "requester") return;
        await requestOfferResponse(errandId, accept);
      },
    );

    // Location is stored in memory only — not persisted to DB — to avoid write storms
    // during active navigation. The matching service reads it directly from userSockets.
    socket.on(
      "update_location",
      ({ lat, lng }: { lat: number; lng: number }) => {
        if (role !== "helper") return;
        const entry = userSockets.get(userId);
        if (entry) entry.coordinates = { lat, lng };
      },
    );

    socket.on("leave_room", (errandId: string) => {
      socket.leave(errandId);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", userId, `(socketId: ${socket.id})`);
      const entry = userSockets.get(userId);
      if (entry) {
        entry.socketIds.delete(socket.id);
        if (entry.socketIds.size === 0) {
          userSockets.delete(userId);
        }
      }
    });
  });

  return io;
};

export type ConnectedHelper = {
  userId: string;
  coordinates?: { lat: number; lng: number };
};

/**
 * Return every currently-connected user whose JWT role is "helper", along
 * with their most recently reported coordinates. Consumed by the matching
 * service to filter candidates by proximity to a new errand.
 */
export const getConnectedHelpers = (): ConnectedHelper[] =>
  Array.from(userSockets.entries())
    .filter(([, value]) => value.role === "helper")
    .map(([userId, value]) => ({ userId, coordinates: value.coordinates }));

/**
 * Emit a Socket.IO event to every active socket belonging to a user.
 *
 * Iterates the user's socketIds so the event reaches all open tabs/devices.
 * Returns true if at least one socket received the event, false if the user
 * is currently offline (no sockets registered).
 */
export const emitToUser = (userId: string, event: string, payload: any) => {
  if (!io) return false;
  const entry = userSockets.get(userId);
  if (!entry || entry.socketIds.size === 0) return false;
  for (const socketId of entry.socketIds) {
    io.to(socketId).emit(event, payload);
  }
  return true;
};
