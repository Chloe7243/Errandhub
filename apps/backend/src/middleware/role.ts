import { Response, NextFunction } from "express";
import { AppError } from "./errors";
import { AuthRequest } from "../types/auth";
import { Role } from "@errandhub/shared";

export const requireRole = (role: Role) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.role !== role) {
      throw new AppError(`Only ${role}s can perform this action`, 403);
    }
    next();
  };
};
