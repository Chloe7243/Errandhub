import { prisma } from "../lib/prisma";
import { AuthRequest } from "../types/auth";
import { AppError } from "../middleware/errors";
import { Response, NextFunction } from "express";
import { activeStatuses, createErrandSchema } from "@errandhub/shared";
import { startErrandMatching } from "../services/matching";
import { emitToUser } from "../lib/socket";
import { notifyUser } from "../lib/notifications";
import { stripe } from "../lib/stripe";

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
      firstLocation,
      finalLocation,
      locationReference,
      type,
      firstLat,
      firstLng,
      finalLat,
      finalLng,
      estimatedDuration,
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
        firstLocation,
        finalLocation: finalLocation ?? firstLocation,
        locationReference,
        suggestedPrice,
        estimatedDuration: estimatedDuration ?? null,
        firstLat,
        firstLng,
        finalLat,
        finalLng,
      },
    });

    res.status(201).json({ errand, message: "Errand created successfully" });
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

export const setPaymentMethod = async (
  req: AuthRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { paymentMethodId } = req.body;

    if (!paymentMethodId)
      throw new AppError("paymentMethodId is required", 400);

    const errand = await prisma.errand.findUnique({ where: { id } });
    if (!errand) throw new AppError("Errand not found", 404);
    if (errand.requesterId !== req.userId)
      throw new AppError("Unauthorised", 403);
    if (errand.stripePaymentIntentId)
      throw new AppError("Payment already authorised for this errand", 400);

    await prisma.errand.update({
      where: { id },
      data: { paymentMethodId },
    });

    await startErrandMatching(errand);

    res.status(200).json({ message: "Payment method saved" });
  } catch (error) {
    next(error);
  }
};

export const startWork = async (
  req: AuthRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const errand = await prisma.errand.findUnique({ where: { id } });
    if (!errand) throw new AppError("Errand not found", 404);
    if (errand.type !== "HANDS_ON_HELP")
      throw new AppError("Only applicable to Hands-On Help errands", 400);
    if (errand.helperId !== req.userId) throw new AppError("Unauthorised", 403);
    if (errand.status !== "IN_PROGRESS")
      throw new AppError("Errand is not in progress", 400);
    if (errand.startedAt) throw new AppError("Work already started", 400);

    const updated = await prisma.errand.update({
      where: { id },
      data: { startedAt: new Date() },
    });

    emitToUser(errand.requesterId, "work_started", { errandId: id });
    await notifyUser(errand.requesterId, {
      title: "Work started",
      body: "Your helper has arrived and started working on your errand.",
      data: { errandId: id },
    });

    res.status(200).json({ errand: updated });
  } catch (error) {
    next(error);
  }
};

export const extendWork = async (
  req: AuthRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { additionalHours } = req.body;

    if (!additionalHours || additionalHours <= 0 || additionalHours > 8)
      throw new AppError("additionalHours must be between 0.5 and 8", 400);

    const errand = await prisma.errand.findUnique({ where: { id } });
    if (!errand) throw new AppError("Errand not found", 404);
    if (errand.type !== "HANDS_ON_HELP")
      throw new AppError("Only applicable to Hands-On Help errands", 400);
    if (errand.helperId !== req.userId) throw new AppError("Unauthorised", 403);
    if (errand.status !== "IN_PROGRESS")
      throw new AppError("Errand is not in progress", 400);
    if (!errand.startedAt) throw new AppError("Work has not been started", 400);

    const newDuration = (errand.estimatedDuration ?? 0) + additionalHours;

    await prisma.errand.update({
      where: { id },
      data: { estimatedDuration: newDuration },
    });

    const hrs = additionalHours === 1 ? "1 hour" : `${additionalHours} hours`;
    emitToUser(errand.requesterId, "errand_extended", {
      errandId: id,
      additionalHours,
      newDuration,
    });
    await notifyUser(errand.requesterId, {
      title: "Job extended",
      body: `Your helper has extended the job by ${hrs}.`,
      data: { errandId: id },
    });

    res
      .status(200)
      .json({ message: "Duration extended", estimatedDuration: newDuration });
  } catch (error) {
    next(error);
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

    let finalCost: number | undefined;
    if (status === "REVIEWING" && errand.type === "HANDS_ON_HELP") {
      if (!errand.startedAt)
        throw new AppError("Work has not been started yet", 400);
      const elapsedMs = Date.now() - new Date(errand.startedAt).getTime();
      const elapsedMinutes = elapsedMs / 60000;
      const billedMinutes = Math.ceil(elapsedMinutes / 15) * 15;
      const billedHours = billedMinutes / 60;
      finalCost =
        Math.round(
          billedHours * (errand.agreedPrice ?? errand.suggestedPrice!) * 100,
        ) / 100;
    }

    if (status === "REVIEWING" && errand.type === "PICKUP_DELIVERY")
      finalCost = errand.agreedPrice ?? errand.suggestedPrice!;
    const updatedErrand = await prisma.errand.update({
      where: { id },
      data: {
        status,
        ...(status === "REVIEWING" && { proofImageUrl, proofNote }),
        ...(finalCost !== undefined && { finalCost }),
        ...(status === "COMPLETED" && { completedAt: new Date() }),
        ...(status === "POSTED" && { helperId: null }),
        ...(status === "EXPIRED" && { helperId: null }),
      },
    });

    if (status === "COMPLETED" && updatedErrand.stripePaymentIntentId) {
      const captureAmount =
        errand.type === "HANDS_ON_HELP" && updatedErrand.finalCost
          ? { amount_to_capture: Math.round(updatedErrand.finalCost * 100) }
          : {};
      await stripe.paymentIntents.capture(
        updatedErrand.stripePaymentIntentId,
        captureAmount,
      );
    }

    if (status === "CANCELLED" && updatedErrand.stripePaymentIntentId) {
      await stripe.paymentIntents.cancel(updatedErrand.stripePaymentIntentId);
    }

    if (status === "REVIEWING") {
      emitToUser(updatedErrand.requesterId, "proof_submitted", {
        errandId: updatedErrand.id,
      });
      await notifyUser(updatedErrand.requesterId, {
        title: "Proof submitted",
        body: "Your helper has marked the errand complete. Please review.",
        data: { errandId: updatedErrand.id },
      });
    }

    if (status === "COMPLETED" && updatedErrand.helperId) {
      emitToUser(updatedErrand.helperId, "errand_completed", {
        errandId: updatedErrand.id,
      });
      await notifyUser(updatedErrand.helperId, {
        title: "Payment released",
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
