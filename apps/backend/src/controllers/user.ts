import { prisma } from "../lib/prisma";
import { AuthRequest } from "../types/auth";
import { AppError } from "../middleware/errors";
import { NextFunction, Response } from "express";
import { ErrandStatus } from "@errandhub/shared";

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

export const getRequestedErrands = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { status } = req.query;
    const statuses = status
      ? ((Array.isArray(status)
          ? status
          : (status as string).split(",")) as ErrandStatus[])
      : undefined;

    const errands = await prisma.errand.findMany({
      where: {
        requesterId: req.userId,
        ...(statuses && { status: { in: statuses } }),
      },
      orderBy: { createdAt: "desc" },
      include: {
        offers: {
          include: {
            helper: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        helper: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(200).json({ errands });
  } catch (error) {
    next(error);
  }
};

export const getHelpedErrands = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { status } = req.query;

    const statuses = status
      ? ((Array.isArray(status)
          ? status
          : (status as string).split(",")) as ErrandStatus[])
      : undefined;

    const errands = await prisma.errand.findMany({
      where: {
        helperId: req.userId,
        ...(statuses && { status: { in: statuses } }),
      },
      orderBy: { createdAt: "desc" },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    console.log({ errands });

    res.status(200).json({ errands });
  } catch (error) {
    next(error);
  }
};

export const getSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const settings = await prisma.userSettings.findUnique({
      where: { userId: req.userId },
    });

    res.status(200).json({ settings });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      isAvailable,
      notificationRadius,
      errandUpdates,
      newMessages,
      promotions,
    } = req.body;

    const settings = await prisma.userSettings.upsert({
      where: { userId: req.userId! },
      update: {
        ...(isAvailable !== undefined && { isAvailable }),
        ...(notificationRadius !== undefined && { notificationRadius }),
        ...(errandUpdates !== undefined && { errandUpdates }),
        ...(newMessages !== undefined && { newMessages }),
        ...(promotions !== undefined && { promotions }),
      },
      create: {
        userId: req.userId!,
        isAvailable: isAvailable ?? false,
        notificationRadius: notificationRadius ?? 2.0,
        errandUpdates: errandUpdates ?? true,
        newMessages: newMessages ?? true,
        promotions: promotions ?? false,
      },
    });

    console.log({ settings });

    res
      .status(200)
      .json({ settings, message: "Settings updated successfully" });
  } catch (error) {
    next(error);
  }
};
