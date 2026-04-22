import { Request, Response, NextFunction } from "express";
import { AppError } from "./errors";

/**
 * Middleware that rejects requests whose JSON body is missing or empty
 * with a 400 Invalid request body. Applied to the /auth routes so the
 * downstream controllers can assume req.body is populated before running
 * Zod validation.
 */
const requireBody = (req: Request, res: Response, next: NextFunction) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return next(new AppError("Invalid request body", 400));
  }
  next();
};

export default requireBody;
