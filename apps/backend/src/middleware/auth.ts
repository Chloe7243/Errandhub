import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errors";
import { AuthRequest } from "../types/auth";

const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Unauthorised", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
      role: string;
    };

    req.userId = decoded.userId;
    req.role = decoded.role;
    next();
  } catch (error) {
    next(new AppError("Unauthorised", 401));
  }
};

export default authMiddleware;
