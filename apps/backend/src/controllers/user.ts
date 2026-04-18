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

    // Always compute summary across ALL errands regardless of the active filter
    const allErrands = await prisma.errand.findMany({
      where: { requesterId: req.userId },
      select: { status: true },
    });

    const summary = {
      totalActive: allErrands.filter((e) =>
        ["POSTED", "IN_PROGRESS", "REVIEWING"].includes(e.status),
      ).length,
      totalCompleted: allErrands.filter((e) => e.status === "COMPLETED").length,
      totalErrands: allErrands.length,
    };

    const errands = await prisma.errand.findMany({
      where: {
        requesterId: req.userId,
        ...(statuses && { status: { in: statuses } }),
      },
      orderBy: { createdAt: "desc" },
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
    });

    res.status(200).json({ errands, summary });
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

    const allTerminal = await prisma.errand.findMany({
      where: {
        helperId: req.userId,
        status: { in: ["COMPLETED", "DISPUTED"] },
      },
      select: { status: true, finalCost: true },
    });

    const summary = {
      totalEarned: allTerminal
        .filter((e) => e.status === "COMPLETED")
        .reduce((sum, e) => sum + (e.finalCost ?? 0), 0),
      totalCompleted: allTerminal.filter((e) => e.status === "COMPLETED")
        .length,
      totalDisputed: allTerminal.filter((e) => e.status === "DISPUTED").length,
    };

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

    res.status(200).json({ errands, summary });
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

export const savePushToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { token } = req.body;
    if (!token) throw new AppError("Token is required", 400);

    await prisma.user.update({
      where: { id: req.userId },
      data: { expoPushToken: token },
    });

    res.status(200).json({ message: "Push token saved" });
  } catch (error) {
    next(error);
  }
};

export const updateAvatar = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { avatarUrl } = req.body;
    if (!avatarUrl) throw new AppError("avatarUrl is required", 400);

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { avatarUrl },
      select: { avatarUrl: true },
    });

    res.status(200).json({ avatarUrl: user.avatarUrl });
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

    res
      .status(200)
      .json({ settings, message: "Settings updated successfully" });
  } catch (error) {
    next(error);
  }
};
