import { Response, NextFunction } from "express";
import { AppError } from "./errors";
import { AuthRequest } from "../types/auth";
import { Role } from "@errandhub/shared";

/**
 * Route-level role guard factory.
 *
 * Returns an Express middleware that 403s unless req.role matches the
 * expected role. Must be chained after authMiddleware since it reads the
 * role that authMiddleware copies off the JWT payload.
 */
export const requireRole = (role: Role) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.role !== role) {
      throw new AppError(`Only ${role}s can perform this action`, 403);
    }
    next();
  };
};
