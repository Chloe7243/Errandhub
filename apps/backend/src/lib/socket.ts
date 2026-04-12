import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";

export const initSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
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
        io.to(errandId).emit("receive_message", message);
      },
    );

    socket.on("leave_room", (errandId: string) => {
      socket.leave(errandId);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.data.userId);
    });
  });

  return io;
};
