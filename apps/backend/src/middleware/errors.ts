import { Request, Response, NextFunction } from "express";

/**
 * Typed error for controller-layer failures.
 *
 * Carries an HTTP status code alongside the message so the global
 * errorHandler can translate it into a proper response instead of leaking
 * stack traces. Throw this anywhere in a request handler and rely on
 * next(err) (or try/catch → next) to surface it.
 */
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Global Express error-handling middleware.
 *
 * Known AppErrors are surfaced to the client with their own status code and
 * message; anything else is logged server-side and masked behind a generic
 * 500 so internals never leak to the API consumer. Must be the last
 * middleware registered on the app.
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  console.error(err);
  res.status(500).json({ message: "Something went wrong" });
};
