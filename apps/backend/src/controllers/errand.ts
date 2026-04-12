import { prisma } from "../lib/prisma";
import { AuthRequest } from "../types/auth";
import { AppError } from "../middleware/errors";
import { Response, NextFunction } from "express";
import { createErrandSchema } from "@errandhub/shared";
import { startErrandMatching } from "../services/matching";

export const createErrand = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = createErrandSchema.safeParse(req.body);
    if (!parsed.success)
      throw new AppError(parsed.error.errors[0].message, 400);

    const {
      title,
      description,
      pickupLocation,
      dropoffLocation,
      pickupReference,
      type,
    } = parsed.data;

    console.log(parsed);

    // TODO: calculate suggested price using Google Maps Distance Matrix API
    // For now use a flat suggested price
    const suggestedPrice = 5.0;

    const errand = await prisma.errand.create({
      data: {
        type,
        requesterId: req.userId!,
        title,
        description,
        pickupLocation,
        dropoffLocation,
        pickupReference,
        suggestedPrice,
      },
    });

    await startErrandMatching(errand);

    res.status(201).json({ errand, message: "Errand created successfully" });
  } catch (error) {
    next(error);
  }
};

export const getPostedErrands = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const errands = await prisma.errand.findMany({
      where: {
        status: "POSTED",
        requesterId: { not: req.userId },
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
        bids: {
          where: { helperId: req.userId },
        },
      },
    });

    res.status(200).json({ errands });
  } catch (error) {
    next(error);
  }
};

export const getErrandById = async (
  req: AuthRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const errand = await prisma.errand.findUnique({
      where: { id },
      include: {
        bids: {
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
        messages: true,
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

    if (!errand) throw new AppError("Errand not found", 404);

    res.status(200).json({ errand });
  } catch (error) {
    next(error);
  }
};

export const submitBid = async (
  req: AuthRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) throw new AppError("Invalid bid amount", 400);

    const errand = await prisma.errand.findUnique({ where: { id } });
    if (!errand) throw new AppError("Errand not found", 404);
    if (errand.status !== "POSTED")
      throw new AppError("Errand is no longer available", 400);

    // check if helper already bid
    const existingBid = await prisma.errandBid.findFirst({
      where: { errandId: id, helperId: req.userId },
    });
    if (existingBid) throw new AppError("You have already placed a bid", 400);

    const bid = await prisma.errandBid.create({
      data: {
        errandId: id,
        helperId: req.userId!,
        amount,
      },
    });

    res.status(201).json({ bid, message: "Bid submitted successfully" });
  } catch (error) {
    next(error);
  }
};

export const acceptBid = async (
  req: AuthRequest<{ id: string; bidId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id, bidId } = req.params;

    const errand = await prisma.errand.findUnique({ where: { id } });
    if (!errand) throw new AppError("Errand not found", 404);
    if (errand.requesterId !== req.userId)
      throw new AppError("Unauthorised", 403);

    const bid = await prisma.errandBid.findUnique({ where: { id: bidId } });
    if (!bid) throw new AppError("Bid not found", 404);

    await prisma.$transaction([
      prisma.errandBid.update({
        where: { id: bidId },
        data: { status: "ACCEPTED" },
      }),
      prisma.errandBid.updateMany({
        where: { errandId: id, id: { not: bidId } },
        data: { status: "DECLINED" },
      }),
      prisma.errand.update({
        where: { id },
        data: {
          status: "ACCEPTED",
          helperId: bid.helperId,
          agreedPrice: bid.amount,
        },
      }),
    ]);

    res.status(200).json({ message: "Bid accepted successfully" });
  } catch (error) {
    next(error);
  }
};

export const declineBid = async (
  req: AuthRequest<{ bidId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { bidId } = req.params;

    const bid = await prisma.errandBid.findUnique({ where: { id: bidId } });
    if (!bid) throw new AppError("Bid not found", 404);

    await prisma.errandBid.update({
      where: { id: bidId },
      data: { status: "DECLINED" },
    });

    res.status(200).json({ message: "Bid declined successfully" });
  } catch (error) {
    next(error);
  }
};

export const acceptErrand = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const errand = await prisma.errand.findUnique({
      where: { id: req.params.id },
    });

    if (!errand) throw new AppError("Errand not found", 404);
    if (errand.status !== "POSTED")
      throw new AppError("Errand is no longer available", 400);

    const activeErrand = await prisma.errand.findFirst({
      where: {
        helperId: req.userId,
        status: { in: ["ACCEPTED", "IN_PROGRESS", "REVIEWING"] },
      },
    });

    if (activeErrand)
      throw new AppError("You already have an active errand", 400);

    const updated = await prisma.errand.update({
      where: { id: req.params.id },
      data: {
        status: "ACCEPTED",
        helperId: req.userId,
        agreedPrice: errand.suggestedPrice,
      },
    });

    res.json({ errand: updated });
  } catch (err) {
    next(err);
  }
};

export const updateErrandStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const errand = await prisma.errand.findUnique({ where: { id } });

    if (!errand) throw new AppError("Errand not found", 404);

    const allowedTransitions: Record<string, string[]> = {
      POSTED: ["TENTATIVELY_ACCEPTED", "CANCELLED", "EXPIRED"],
      TENTATIVELY_ACCEPTED: ["ACCEPTED", "POSTED"],
      ACCEPTED: ["IN_PROGRESS", "CANCELLED"],
      IN_PROGRESS: ["REVIEWING", "CANCELLED"],
      REVIEWING: ["COMPLETED", "DISPUTED"],
    };

    const allowed = allowedTransitions[errand.status];

    if (!allowed || !allowed.includes(status)) {
      throw new AppError(`Cannot move from ${errand.status} to ${status}`, 400);
    }

    // Only the assigned helper can move forward
    if (
      ["IN_PROGRESS", "REVIEWING"].includes(status) &&
      errand.helperId !== req.userId
    ) {
      throw new AppError(
        "Only the assigned helper can update this errand",
        403,
      );
    }

    // Only the requester can confirm completion or cancel
    if (
      ["COMPLETED", "CANCELLED"].includes(status) &&
      errand.requesterId !== req.userId
    ) {
      throw new AppError("Only the requester can perform this action", 403);
    }

    const updatedErrand = await prisma.errand.update({
      where: { id },
      data: {
        status,
        ...(status === "COMPLETED" && { completedAt: new Date() }),
        ...(status === "POSTED" && {
          helperId: null,
          reviewWindowExpiresAt: null,
        }),
        ...(status === "EXPIRED" && {
          helperId: null,
          reviewWindowExpiresAt: null,
        }),
      },
    });

    res
      .status(200)
      .json({ errand: updatedErrand, message: "Errand status updated" });
  } catch (error) {
    next(error);
  }
};
