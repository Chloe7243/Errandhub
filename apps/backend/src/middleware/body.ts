import { Request, Response, NextFunction } from "express";
import { AppError } from "./errors";

const requireBody = (req: Request, res: Response, next: NextFunction) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return next(new AppError("Invalid request body", 400));
  }
  next();
};

export default requireBody;
