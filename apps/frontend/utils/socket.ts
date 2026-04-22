import { io, Socket } from "socket.io-client";
import { getToken } from "./secure-store";

// Module-level singleton so any screen can grab the same socket instance via
// getSocket() without creating duplicate connections.
let socket: Socket | null = null;

/**
 * Lazily connect to the backend Socket.IO server and authenticate.
 *
 * Reads the JWT from SecureStore and passes it via the socket.io `auth`
 * handshake. Forces the websocket transport (no long-polling fallback) so
 * React Native can rely on a single transport. Awaits the `connect` event
 * so callers can register listeners / issue emits without racing the
 * server-side socket registration. Returns the singleton socket instance.
 */
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

/** Return the current socket singleton (or null if not yet connected). */
export const getSocket = () => socket;

/**
 * Disconnect and null-out the socket singleton. Used on logout so a new
 * login can establish a fresh authenticated connection.
 */
export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
