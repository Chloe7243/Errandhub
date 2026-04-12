import { io, Socket } from "socket.io-client";
import { getToken } from "./secure-store";

let socket: Socket | null = null;

export const connectSocket = async (): Promise<Socket> => {
  // Return existing socket if it's already connected
  if (socket?.connected) return socket;

  const token = await getToken();

  socket = io(process.env.EXPO_PUBLIC_API_URL, {
    auth: { token },
    transports: ["websocket"],
  });

  // Wait for the connection to actually establish before returning.
  // This prevents callers from registering events or using getConnectedHelpers()
  // before the backend has added the socket to userSockets.
  await new Promise<void>((resolve, reject) => {
    socket!.once("connect", resolve);
    socket!.once("connect_error", reject);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
