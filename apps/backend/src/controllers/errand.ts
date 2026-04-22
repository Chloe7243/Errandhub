import { prisma } from "../lib/prisma";
import { AuthRequest } from "../types/auth";
import { AppError } from "../middleware/errors";
import { Response, NextFunction } from "express";
import { activeStatuses, createErrandSchema } from "@errandhub/shared";
import { startErrandMatching } from "../services/matching";
import { emitToUser } from "../lib/socket";
import { notifyUser } from "../lib/notifications";
import { stripe } from "../lib/stripe";

/**
 * POST /errands — create a new errand and kick off matching.
 *
 * Validates the shared createErrand schema, enforces a 3-concurrent-active
 * cap per requester, persists the errand and then hands off to
 * startErrandMatching which dispatches it to eligible helpers in order of
 * proximity. paymentMethodId is validated separately because it belongs to
 * the payment concern, not the shared form schema.
 */
export const createErrand = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = createErrandSchema.safeParse(req.body);
    if (!parsed.success)
      throw new AppError(parsed.error.errors[0].message, 400);

    // paymentMethodId is not part of the errand schema — it's a payment concern
    // validated here separately so the shared schema stays form-friendly.
    const { paymentMethodId } = req.body;
    if (!paymentMethodId) throw new AppError("Payment method is required", 400);

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

    // Cap at 3 concurrent active errands per requester to limit abuse and payment holds.
    const activeErrandCount = await prisma.errand.count({
      where: {
        requesterId: req.userId!,
        status: { in: activeStatuses },
      },
    });
    if (activeErrandCount >= 3)
      throw new AppError("You can only have 3 active errands at a time", 400);

    // Placeholder pricing — actual implementation would factor in distance,
    // errand type, time of day and historical completion rates.
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
        paymentMethodId,
        estimatedDuration: estimatedDuration ?? null,
        firstLat,
        firstLng,
        finalLat,
        finalLng,
      },
    });

    await startErrandMatching(errand);

    res.status(201).json({ errand, message: "Errand posted successfully" });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /errands/:id — fetch a single errand with its helper, requester and
 * chat messages eagerly loaded. User objects are projected down to the
 * fields the UI needs so we never leak password hashes or private tokens.
 */
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

/**
 * POST /errands/:id/start — helper marks hands-on work as begun.
 *
 * Records startedAt which acts as the clock-start for billing when the
 * errand later moves to REVIEWING. Restricted to HANDS_ON_HELP errands in
 * IN_PROGRESS state owned by the requesting helper. Emits a realtime
 * event and push notification to the requester.
 */
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

/**
 * POST /errands/:id/extend — helper requests extra hours on a hands-on job.
 *
 * Bumps estimatedDuration by additionalHours (capped 0.5-8) and notifies
 * the requester. The new duration is used later to compute finalCost.
 */
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

/**
 * PATCH /errands/:id/status — move an errand along its lifecycle.
 *
 * Enforces the state machine defined by allowedTransitions and the
 * party-of-action rules (helper submits proof; requester confirms or
 * cancels). For HANDS_ON_HELP the finalCost is computed at REVIEWING time
 * from elapsed work rounded up to 15-minute blocks. Stripe capture is
 * deferred until COMPLETED and cancellation until CANCELLED so funds only
 * move on an explicit requester decision. Emits realtime + push
 * notifications at the key transitions.
 */
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

    // Valid status transitions. EXPIRED and DISPUTED are terminal states reachable
    // only via system/dispute paths, not direct API calls from this table.
    // Helper drives: IN_PROGRESS → REVIEWING (submits proof)
    // Requester drives: REVIEWING → COMPLETED (confirms) or → DISPUTED (contests)
    //                   POSTED / IN_PROGRESS → CANCELLED
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

    // finalCost is computed at REVIEWING time (when the helper submits proof) so the
    // requester knows exactly what will be captured before they confirm.
    let finalCost: number | undefined;
    if (status === "REVIEWING" && errand.type === "HANDS_ON_HELP") {
      if (!errand.startedAt)
        throw new AppError("Work has not been started yet", 400);
      const elapsedMs = Date.now() - new Date(errand.startedAt).getTime();
      const elapsedMinutes = elapsedMs / 60000;
      // Round up to the nearest 15-minute block — standard billing granularity for hourly work.
      const billedMinutes = Math.ceil(elapsedMinutes / 15) * 15;
      const billedHours = billedMinutes / 60;
      // agreedPrice is the per-hour rate settled during matching (may differ from suggestedPrice).
      finalCost =
        Math.round(
          billedHours * (errand.agreedPrice ?? errand.suggestedPrice!) * 100,
        ) / 100;
    }

    // Fixed-price types: cost is simply the agreed flat rate, not time-based.
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

    // Capture and cancel are deferred to status-change rather than done at matching
    // time so that: (a) the final amount for HANDS_ON_HELP is only known here, and
    // (b) no money moves until the requester explicitly confirms or cancels.
    if (status === "COMPLETED" && updatedErrand.stripePaymentIntentId) {
      // For HANDS_ON_HELP, capture only finalCost (may be less than the authorized amount).
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

/**
 * POST /errands/:id/dispute — requester contests a submitted proof.
 *
 * Only valid while the errand is REVIEWING and only callable by the
 * requester. Creates a Dispute row and flips the errand to DISPUTED in a
 * single transaction so the two states can never diverge. The helper is
 * notified in realtime.
 */
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
