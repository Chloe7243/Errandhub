import { Request } from "express";

export interface AuthRequest<P = Record<string, string>> extends Request<P> {
  userId?: string;
  role?: string;
}
