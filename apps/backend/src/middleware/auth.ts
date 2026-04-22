import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errors";
import { AuthRequest } from "../types/auth";

/**
 * Express middleware that verifies the incoming Bearer JWT.
 *
 * On success attaches decoded userId and role to req so downstream handlers
 * can trust them without re-parsing the token. Any failure — missing header,
 * wrong scheme, bad signature, expired — collapses to a single 401 so the
 * response never hints at which part was wrong.
 */
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
