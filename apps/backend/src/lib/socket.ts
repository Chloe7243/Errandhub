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

let io: Server | null = null;

// Stores all active socket IDs per user so multiple tabs/devices are handled
// correctly. A user is only considered offline when their last socket disconnects.
type UserSocketEntry = {
  socketIds: Set<string>;
  role: string;
  coordinates?: { lat: number; lng: number };
};

const userSockets = new Map<string, UserSocketEntry>();

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
      console.log("Socket", { decoded });
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

        // Deliver to both participants directly so the message arrives even
        // when the other person isn't in the chat room.
        const errand = await prisma.errand.findUnique({
          where: { id: errandId },
          select: { requesterId: true, helperId: true },
        });

        if (errand) {
          emitToUser(errand.requesterId, "receive_message", message);
          if (errand.helperId) {
            emitToUser(errand.helperId, "receive_message", message);
          }
        } else {
          // Fallback: broadcast to room
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

export const getConnectedHelpers = (): ConnectedHelper[] =>
  Array.from(userSockets.entries())
    .filter(([, value]) => value.role === "helper")
    .map(([userId, value]) => ({ userId, coordinates: value.coordinates }));

// Emits to ALL active sockets for a user (covers multiple tabs/devices)
export const emitToUser = (userId: string, event: string, payload: any) => {
  if (!io) return false;
  const entry = userSockets.get(userId);
  if (!entry || entry.socketIds.size === 0) return false;
  for (const socketId of entry.socketIds) {
    io.to(socketId).emit(event, payload);
  }
  return true;
};
