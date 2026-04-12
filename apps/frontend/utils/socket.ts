import { io, Socket } from "socket.io-client";
import { getToken } from "./secure-store";

let socket: Socket | null = null;

export const connectSocket = async () => {
  if (socket?.connected) return socket;

  const token = await getToken();

  socket = io(process.env.EXPO_PUBLIC_API_URL!.replace("/api", ""), {
    auth: { token },
    transports: ["websocket"],
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
