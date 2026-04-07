import { prisma } from "../lib/prisma";
import { AuthRequest } from "../types/auth";
import { AppError } from "../middleware/errors";
import { NextFunction, Response } from "express";

export const getUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        university: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) throw new AppError("User not found", 404);

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};
