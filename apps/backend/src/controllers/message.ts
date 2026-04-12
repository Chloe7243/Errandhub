import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

export const getMessages = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { errandId } = req.params;

    const messages = await prisma.message.findMany({
      where: { errandId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        senderId: true,
        content: true,
        imageUrl: true,
        createdAt: true,
      },
    });

    res.json(messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })));
  } catch (err) {
    next(err);
  }
};
