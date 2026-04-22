import { Request } from "express";

/**
 * Augmented Express Request for routes that sit behind authMiddleware.
 *
 * The middleware copies userId and role off the decoded JWT onto the
 * request. They are optional at the type level because the underlying
 * Express Request is unauthenticated — in practice every handler reached
 * through authMiddleware can rely on them being set.
 */
export interface AuthRequest<P = Record<string, string>> extends Request<P> {
  userId?: string;
  role?: string;
}
