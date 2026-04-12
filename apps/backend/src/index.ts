import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";

import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import errandRoutes from "./routes/errand";
import { initSocket } from "./lib/socket";
import requireBody from "./middleware/body";
import authMiddleware from "./middleware/auth";
import { errorHandler } from "./middleware/errors";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE",
  );
  next();
});

const httpServer = createServer(app);
initSocket(httpServer);

// ROUTES
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
app.use("/auth", requireBody, authRoutes);
app.use("/user", authMiddleware, userRoutes);
app.use("/errand", authMiddleware, errandRoutes);
app.use(errorHandler);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
