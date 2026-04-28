import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";

import { initSocket } from "./lib/socket";
import { prisma } from "./lib/prisma";

import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import errandRoutes from "./routes/errand";
import paymentRoutes from "./routes/payment";

import requireBody from "./middleware/body";
import authMiddleware from "./middleware/auth";
import { errorHandler } from "./middleware/errors";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// Permissive CORS — the mobile client runs on a range of Expo / device
// hostnames during development, so we allow any origin. In production this
// would be tightened to the known app domains.
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE",
  );
  next();
});

// Wrap Express in a raw http.Server so socket.io can share the same port
// for chat / live errand updates.
const httpServer = createServer(app);
initSocket(httpServer);

// ROUTES
// /health is unauthenticated for uptime probes.
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
// /auth is public (login/signup) but requires a non-empty body.
// Everything else is JWT-protected by authMiddleware.
app.use("/auth", requireBody, authRoutes);
app.use("/user", authMiddleware, userRoutes);
app.use("/errand", authMiddleware, errandRoutes);
app.use("/payment", authMiddleware, paymentRoutes);
// Must be registered last so it catches errors thrown in any route above.
app.use(errorHandler);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// FR-22: Auto-expire POSTED errands that were never matched.
// Runs every 10 minutes. Any errand that has been POSTED for longer than
// 30 minutes without being picked up is transitioned to EXPIRED so it
// doesn't sit stale in the requester's active list indefinitely.
const EXPIRY_INTERVAL_MS = 10 * 60 * 1000;
const EXPIRY_THRESHOLD_MS = 30 * 60 * 1000;

setInterval(async () => {
  const cutoff = new Date(Date.now() - EXPIRY_THRESHOLD_MS);
  const { count } = await prisma.errand.updateMany({
    where: { status: "POSTED", createdAt: { lt: cutoff } },
    data: { status: "EXPIRED" },
  });
  if (count > 0) console.log(`[expiry] Expired ${count} stale errand(s)`);
}, EXPIRY_INTERVAL_MS);
