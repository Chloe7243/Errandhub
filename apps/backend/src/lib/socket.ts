import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import {
  helperAcceptErrand,
  helperCounterOffer,
  helperDeclineErrand,
  requestOfferResponse,
} from "../services/matching";

let io: Server | null = null;
const userSockets = new Map<string, { socketId: string; role: string }>();

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
    console.log("User connected:", socket.data.userId);
    userSockets.set(socket.data.userId, {
      socketId: socket.id,
      role: socket.data.role,
    });

    socket.on("join_room", (errandId: string) => {
      socket.join(errandId);
    });

    socket.on(
      "send_message",
      ({
        errandId,
        content,
        imageUrl,
      }: {
        errandId: string;
        content?: string;
        imageUrl?: string;
      }) => {
        const message = {
          id: Date.now().toString(),
          senderId: socket.data.userId,
          content,
          imageUrl,
          createdAt: new Date().toISOString(),
        };
        io?.to(errandId).emit("receive_message", message);
      },
    );

    socket.on("accept_errand", async ({ errandId }: { errandId: string }) => {
      if (socket.data.role !== "helper") return;
      await helperAcceptErrand(errandId, socket.data.userId);
    });

    socket.on("decline_errand", async ({ errandId }: { errandId: string }) => {
      if (socket.data.role !== "helper") return;
      await helperDeclineErrand(errandId, socket.data.userId);
    });

    socket.on(
      "counter_offer",
      async ({ errandId, amount }: { errandId: string; amount: number }) => {
        if (socket.data.role !== "helper") return;
        await helperCounterOffer(errandId, socket.data.userId, amount);
      },
    );

    socket.on(
      "offer_response",
      async ({ errandId, accept }: { errandId: string; accept: boolean }) => {
        if (socket.data.role !== "requester") return;
        await requestOfferResponse(errandId, accept);
      },
    );

    socket.on("leave_room", (errandId: string) => {
      socket.leave(errandId);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.data.userId);
      userSockets.delete(socket.data.userId);
    });
  });

  return io;
};

export const getSocketId = (userId: string) =>
  userSockets.get(userId)?.socketId;
export const getConnectedHelpers = () =>
  Array.from(userSockets.entries())
    .filter(([, value]) => value.role === "helper")
    .map(([userId]) => userId);

export const emitToUser = (userId: string, event: string, payload: any) => {
  if (!io) return false;
  const socketId = getSocketId(userId);
  if (!socketId) return false;
  io.to(socketId).emit(event, payload);
  return true;
};
