import { prisma } from "../lib/prisma";
import { AuthRequest } from "../types/auth";
import { AppError } from "../middleware/errors";
import { Response, NextFunction } from "express";
import { activeStatuses, createErrandSchema } from "@errandhub/shared";
import { startErrandMatching } from "../services/matching";
import { emitToUser } from "../lib/socket";
import { notifyUser } from "../lib/notifications";

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
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng,
    } = parsed.data;

    const activeErrandCount = await prisma.errand.count({
      where: {
        requesterId: req.userId!,
        status: {
          in: activeStatuses,
        },
      },
    });
    if (activeErrandCount >= 3)
      throw new AppError("You can only have 3 active errands at a time", 400);

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
        pickupLat,
        pickupLng,
        dropoffLat,
        dropoffLng,
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
        offers: {
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
            phone: true,
          },
        },
        messages: true,
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            phone: true,
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

export const submitOffer = async (
  req: AuthRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) throw new AppError("Invalid offer amount", 400);

    const errand = await prisma.errand.findUnique({ where: { id } });
    if (!errand) throw new AppError("Errand not found", 404);
    if (errand.status !== "POSTED")
      throw new AppError("Errand is no longer available", 400);

    // check if helper already submitted an offer
    const existingOffer = await prisma.errandOffer.findFirst({
      where: { errandId: id, helperId: req.userId },
    });
    if (existingOffer)
      throw new AppError("You have already submitted an offer", 400);

    const offer = await prisma.errandOffer.create({
      data: {
        errandId: id,
        helperId: req.userId!,
        amount,
      },
    });

    res.status(201).json({ offer, message: "Offer submitted successfully" });
  } catch (error) {
    next(error);
  }
};

export const acceptOffer = async (
  req: AuthRequest<{ id: string; offerId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id, offerId } = req.params;

    const errand = await prisma.errand.findUnique({ where: { id } });
    if (!errand) throw new AppError("Errand not found", 404);
    if (errand.requesterId !== req.userId)
      throw new AppError("Unauthorised", 403);

    const offer = await prisma.errandOffer.findUnique({
      where: { id: offerId },
    });
    if (!offer) throw new AppError("Offer not found", 404);

    await prisma.$transaction([
      prisma.errandOffer.update({
        where: { id: offerId },
        data: { status: "ACCEPTED" },
      }),
      prisma.errandOffer.updateMany({
        where: { errandId: id, id: { not: offerId } },
        data: { status: "DECLINED" },
      }),
      prisma.errand.update({
        where: { id },
        data: {
          status: "ACCEPTED",
          helperId: offer.helperId,
          agreedPrice: offer.amount,
        },
      }),
    ]);

    res.status(200).json({ message: "Offer accepted successfully" });
  } catch (error) {
    next(error);
  }
};

export const declineOffer = async (
  req: AuthRequest<{ offerId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { offerId } = req.params;

    const offer = await prisma.errandOffer.findUnique({
      where: { id: offerId },
    });
    if (!offer) throw new AppError("Offer not found", 404);

    await prisma.errandOffer.update({
      where: { id: offerId },
      data: { status: "DECLINED" },
    });

    res.status(200).json({ message: "Offer declined successfully" });
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
        status: "IN_PROGRESS",
        helperId: req.userId,
        agreedPrice: errand.suggestedPrice,
      },
    });

    emitToUser(errand.requesterId, "errand_assigned", {
      errandId: updated.id,
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
    const { status, proofImageUrl, proofNote } = req.body;
    const errand = await prisma.errand.findUnique({ where: { id } });

    if (!errand) throw new AppError("Errand not found", 404);

    const allowedTransitions: Record<string, string[]> = {
      POSTED: ["CANCELLED", "EXPIRED"],
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
        ...(status === "REVIEWING" && { proofImageUrl, proofNote }),
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

    if (status === "REVIEWING") {
      emitToUser(updatedErrand.requesterId, "proof_submitted", {
        errandId: updatedErrand.id,
      });
      await notifyUser(updatedErrand.requesterId, {
        title: "Proof submitted 📸",
        body: "Your helper has marked the errand complete. Please review.",
        data: { errandId: updatedErrand.id },
      });
    }

    if (status === "COMPLETED" && updatedErrand.helperId) {
      emitToUser(updatedErrand.helperId, "errand_completed", {
        errandId: updatedErrand.id,
      });
      await notifyUser(updatedErrand.helperId, {
        title: "Payment released 💸",
        body: "The requester confirmed your errand. Great work!",
        data: { errandId: updatedErrand.id },
      });
    }

    res
      .status(200)
      .json({ errand: updatedErrand, message: "Errand status updated" });
  } catch (error) {
    next(error);
  }
};

export const raiseDispute = async (
  req: AuthRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { reason, explanation, evidenceImageUrl } = req.body;

    if (!reason || !explanation) {
      throw new AppError("reason and explanation are required", 400);
    }

    const errand = await prisma.errand.findUnique({ where: { id } });
    if (!errand) throw new AppError("Errand not found", 404);
    if (errand.status !== "REVIEWING")
      throw new AppError(
        "Dispute can only be raised while the errand is under review",
        400,
      );
    if (errand.requesterId !== req.userId)
      throw new AppError("Only the requester can raise a dispute", 403);

    const dispute = await prisma.$transaction(async (tx) => {
      const created = await tx.dispute.create({
        data: {
          errandId: id,
          raisedById: req.userId!,
          reason,
          explanation,
          evidenceImageUrl,
        },
      });

      await tx.errand.update({
        where: { id },
        data: { status: "DISPUTED" },
      });

      return created;
    });

    if (errand.helperId) {
      await notifyUser(errand.helperId, {
        title: "Dispute raised",
        body: "The requester has raised a dispute on your errand.",
        data: { errandId: id },
      });
      emitToUser(errand.helperId, "errand_disputed", { errandId: id });
    }

    res.status(201).json({ dispute });
  } catch (error) {
    next(error);
  }
};
