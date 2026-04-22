import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";

import { initSocket } from "./lib/socket";

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
