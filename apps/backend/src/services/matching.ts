import { prisma } from "../lib/prisma";
import { Errand } from "../../generated/prisma";
import { activeStatuses } from "@errandhub/shared";
import { emitToUser, getConnectedHelpers } from "../lib/socket";
import { notifyUser } from "../lib/notifications";
import { authorizeErrandPayment } from "../controllers/payment";

/**
 * Great-circle distance between two lat/lng points in kilometers.
 *
 * Haversine is accurate enough for the small distances involved in local
 * errand matching and avoids the overhead of a full geospatial query on
 * what is otherwise a tiny working set (connected helpers at a given moment).
 */
const haversineKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Per-errand state machine held in memory. The lifecycle for a single errand is:
//   POSTED → helper selected → (accept → confirmHelper) or
//                              (counter-offer → requester accept/reject) or
//                              (decline / timeout → next eligible helper) or
//                              (no more helpers → expireErrand → EXPIRED)
// State is discarded as soon as the errand is assigned or expires.
type MatchingState = {
  errandId: string;
  requesterId: string;
  // Tracks every helper already approached so we never retry them in the same round.
  triedHelperIds: Set<string>;
  currentHelperId?: string;
  // Fires if the helper doesn't respond within ERRAND_REQUEST_RESPONSE_TIMER.
  responseTimer?: NodeJS.Timeout;
  // Fires if the requester doesn't respond to a counter-offer within ERRAND_COUNTER_OFFER_TIMER.
  offerTimer?: NodeJS.Timeout;
  pendingOfferAmount?: number;
};

const matchingState = new Map<string, MatchingState>();

// 5 minutes for a helper to accept/decline/counter; 1 minute for the requester to respond to a counter.
const ERRAND_REQUEST_RESPONSE_TIMER = 5 * 60 * 1000;
const ERRAND_COUNTER_OFFER_TIMER = 60 * 1000;

const clearTimers = (state: MatchingState) => {
  if (state.responseTimer) {
    clearTimeout(state.responseTimer);
    state.responseTimer = undefined;
  }
  if (state.offerTimer) {
    clearTimeout(state.offerTimer);
    state.offerTimer = undefined;
  }
};

const cleanupMatchingState = (errandId: string) => {
  const state = matchingState.get(errandId);
  if (!state) return;
  clearTimers(state);
  matchingState.delete(errandId);
};

const getErrand = async (errandId: string) => {
  return prisma.errand.findUnique({
    where: { id: errandId },
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
};

const scheduleHelper = async (errandId: string) => {
  const state = matchingState.get(errandId);
  if (!state) return;

  const errand = await getErrand(errandId);

  if (!errand || errand.status !== "POSTED") {
    cleanupMatchingState(errandId);
    return;
  }

  const availableSettings = await prisma.userSettings.findMany({
    where: {
      isAvailable: true,
      userId: { not: errand.requesterId },
    },
    select: { userId: true, notificationRadius: true },
  });

  const availableMap = new Map(
    availableSettings.map((s) => [s.userId, s.notificationRadius]),
  );

  const connectedHelpers = getConnectedHelpers().filter(({ userId }) =>
    availableMap.has(userId),
  );

  // Fall through (include helper) when location data is missing on either side
  // rather than silently excluding them — better to over-notify than miss a match.
  const inRangeHelpers = connectedHelpers.filter(({ userId, coordinates }) => {
    if (!coordinates || !errand.firstLat || !errand.firstLng) return true;
    const radius = availableMap.get(userId) ?? 2;
    return (
      haversineKm(
        coordinates.lat,
        coordinates.lng,
        errand.firstLat,
        errand.firstLng,
      ) <= radius
    );
  });

  const connectedHelperIds = inRangeHelpers.map(({ userId }) => userId);

  // No connected helpers in range — expire immediately rather than polling.
  if (connectedHelperIds.length === 0) {
    await expireErrand(errandId);
    return;
  }

  // Exclude helpers already handling an active errand; one errand per helper at a time.
  const busyHelpers = await prisma.errand.findMany({
    where: {
      helperId: { in: connectedHelperIds },
      status: { in: activeStatuses },
    },
    select: { helperId: true },
  });
  const busyHelperIds = new Set(busyHelpers.map((item) => item.helperId));

  // Also exclude any helper already tried this round so we don't ping them twice.
  const eligibleHelpers = connectedHelperIds.filter(
    (helperId) =>
      !busyHelperIds.has(helperId) && !state.triedHelperIds.has(helperId),
  );

  if (eligibleHelpers.length === 0) {
    await expireErrand(errandId);
    return;
  }

  // Random selection avoids always overloading the same helper when multiple are eligible.
  const newHelperId =
    eligibleHelpers[Math.floor(Math.random() * eligibleHelpers.length)];
  state.currentHelperId = newHelperId;

  if (!errand || !errand.requester) {
    await expireErrand(errandId);
    return;
  }

  emitToUser(newHelperId, "errand_request", {
    errandId: errand.id,
    title: errand.title,
    description: errand.description,
    firstLocation: errand.firstLocation,
    finalLocation: errand.finalLocation,
    locationReference: errand.locationReference,
    suggestedPrice: errand.suggestedPrice!,
    estimatedDuration: errand.estimatedDuration ?? null,
    type: errand.type,
    requester: {
      id: errand.requester.id,
      firstName: errand.requester.firstName,
      lastName: errand.requester.lastName,
      avatarUrl: errand.requester.avatarUrl,
    },
    expiresAt: new Date(
      Date.now() + ERRAND_REQUEST_RESPONSE_TIMER,
    ).toISOString(),
  });

  // If the helper goes silent, mark them tried and move to the next candidate.
  state.responseTimer = setTimeout(() => {
    if (state.currentHelperId) {
      state.triedHelperIds.add(state.currentHelperId);
    }
    state.currentHelperId = undefined;
    scheduleHelper(errandId);
  }, ERRAND_REQUEST_RESPONSE_TIMER);
};

const getHelperProfile = async (helperId: string) => {
  const helper = await prisma.user.findUnique({
    where: { id: helperId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
    },
  });

  if (!helper) return null;

  const completedCount = await prisma.errand.count({
    where: {
      helperId,
      status: "COMPLETED",
    },
  });

  return {
    ...helper,
    completedCount,
  };
};

const expireErrand = async (errandId: string) => {
  await prisma.errand.update({
    where: { id: errandId },
    data: { status: "EXPIRED", helperId: null },
  });

  const errand = await getErrand(errandId);
  if (errand?.requester) {
    emitToUser(errand.requester.id, "errand_expired", { errandId });
  }

  cleanupMatchingState(errandId);
};

/**
 * Entry point into the matching flow for a freshly-posted errand.
 *
 * Initialises the in-memory MatchingState and triggers the first round of
 * scheduleHelper. No-op if the errand is already past POSTED (e.g. cancelled
 * by the requester before matching began).
 */
export const startErrandMatching = async (
  errand: Pick<Errand, "id" | "requesterId" | "status">,
) => {
  if (errand.status !== "POSTED") return;

  matchingState.set(errand.id, {
    errandId: errand.id,
    requesterId: errand.requesterId,
    triedHelperIds: new Set(),
  });

  await scheduleHelper(errand.id);
};

/**
 * Helper accepts the errand at the suggested price (no counter-offer).
 *
 * Validates that the helper is the currently-pinged candidate and that the
 * errand is still POSTED, then clears pending timers and confirms the
 * assignment via confirmHelper.
 */
export const helperAcceptErrand = async (
  errandId: string,
  helperId: string,
  isFavour: boolean = false,
) => {
  const state = matchingState.get(errandId);
  if (!state || state.currentHelperId !== helperId) return;

  const errand = await prisma.errand.findUnique({ where: { id: errandId } });
  if (!errand || errand.status !== "POSTED") return;

  clearTimers(state);
  confirmHelper(errandId, undefined, isFavour);
};

/**
 * Helper proposes an alternative price for the errand.
 *
 * Validates the amount falls between the suggested price and 2x that price,
 * enforces 50p granularity, then pings the requester with a counter-offer
 * event and switches from the helper-response timer to the shorter
 * requester-response timer.
 */
export const helperCounterOffer = async (
  errandId: string,
  helperId: string,
  amount: number,
) => {
  const state = matchingState.get(errandId);
  if (!state || state.currentHelperId !== helperId) return;

  const errand = await prisma.errand.findUnique({ where: { id: errandId } });
  if (!errand || errand.status !== "POSTED") return;

  const minAmount = errand.suggestedPrice ?? 1;
  // Cap counter-offers at 2× the suggested price to prevent runaway pricing.
  const maxAmount = minAmount * 2;
  // The third condition enforces 50p granularity (amount must be a multiple of 0.5).
  if (
    amount < minAmount ||
    amount > maxAmount ||
    Math.abs(amount * 2 - Math.round(amount * 2)) > 0
  ) {
    return;
  }

  if (state.responseTimer) {
    clearTimeout(state.responseTimer);
    state.responseTimer = undefined;
  }

  state.pendingOfferAmount = amount;
  state.offerTimer = setTimeout(() => {
    if (state.currentHelperId) {
      state.triedHelperIds.add(state.currentHelperId);
    }
    state.currentHelperId = undefined;
    scheduleHelper(errandId);
  }, ERRAND_COUNTER_OFFER_TIMER);

  const helperProfile = await getHelperProfile(helperId);
  const errandDetails = await getErrand(errandId);
  if (!helperProfile || !errandDetails?.requester) {
    return;
  }

  emitToUser(errandDetails.requester.id, "counter_offer", {
    errandId,
    helper: helperProfile,
    amount,
    expiresAt: new Date(Date.now() + ERRAND_COUNTER_OFFER_TIMER).toISOString(),
  });

  await notifyUser(errandDetails.requester.id, {
    title: "Counter offer received",
    body: `${helperProfile.firstName} offered £${amount.toFixed(2)} for your errand`,
    data: { errandId },
  });
};

/**
 * Requester accepts or rejects a pending counter-offer.
 *
 * On accept, confirms assignment at the offered amount. On reject, marks the
 * helper as tried, notifies them, and falls back to scheduleHelper to find
 * the next candidate.
 */
export const requestOfferResponse = async (
  errandId: string,
  accept: boolean,
) => {
  const state = matchingState.get(errandId);
  if (!state || !state.currentHelperId) return;

  if (state.offerTimer) {
    clearTimeout(state.offerTimer);
    state.offerTimer = undefined;
  }

  if (accept) {
    const amount = state.pendingOfferAmount ?? 0;
    confirmHelper(errandId, amount);
    state.pendingOfferAmount = undefined;
    return;
  }

  const rejectedHelperId = state.currentHelperId;
  state.triedHelperIds.add(rejectedHelperId);
  state.currentHelperId = undefined;
  state.pendingOfferAmount = undefined;

  emitToUser(rejectedHelperId, "offer_rejected", { errandId });

  await scheduleHelper(errandId);
};

/**
 * Helper explicitly declines the current errand request.
 *
 * Adds them to triedHelperIds (so they won't be retried this round) and
 * immediately kicks off another scheduleHelper pass to find a replacement.
 */
export const helperDeclineErrand = async (
  errandId: string,
  helperId: string,
) => {
  const state = matchingState.get(errandId);
  if (!state || state.currentHelperId !== helperId) return;

  if (state.responseTimer) {
    clearTimeout(state.responseTimer);
    state.responseTimer = undefined;
  }

  state.triedHelperIds.add(helperId);
  state.currentHelperId = undefined;
  await scheduleHelper(errandId);
};

/**
 * Finalise the helper assignment and transition the errand to IN_PROGRESS.
 *
 * Persists the helperId and agreedPrice, attempts to authorise payment
 * (failures are swallowed so a Stripe outage doesn't prevent assignment —
 * capture is retried at status-change time), emits realtime events to both
 * sides, sends a push notification to the requester, and disposes of the
 * matching state. `amount` is optional and only set when assignment follows
 * an accepted counter-offer.
 */
export const confirmHelper = async (
  errandId: string,
  amount?: number,
  isFavour: boolean = false,
) => {
  const state = matchingState.get(errandId);

  if (!state || !state.currentHelperId) return;

  const errand = await prisma.errand.findUnique({ where: { id: errandId } });
  if (!errand || errand.status !== "POSTED") {
    expireErrand(errandId);
    cleanupMatchingState(errandId);
    return;
  }

  const updated = await prisma.errand.update({
    where: { id: errandId },
    data: {
      helperId: state.currentHelperId,
      agreedPrice: isFavour ? 0 : (amount ?? errand.suggestedPrice),
      isFavour,
      status: "IN_PROGRESS",
    },
  });

  if (!isFavour) {
    // Authorization is best-effort here — a failure should not block assignment.
    // The payment intent is captured (or cancelled) later when the errand status changes.
    try {
      await authorizeErrandPayment(updated);
    } catch (err) {
      console.error("Payment authorization failed in matching:", err);
    }
  }

  emitToUser(state.currentHelperId, "errand_assigned", {
    errandId: updated.id,
    isFavour,
  });
  emitToUser(state.requesterId, "errand_assigned", {
    errandId: updated.id,
    isFavour,
  });

  if (isFavour) {
    const helper = await prisma.user.findUnique({
      where: { id: state.currentHelperId },
      select: { firstName: true },
    });
    await notifyUser(state.requesterId, {
      title: "You're in luck! 🤝",
      body: `${helper?.firstName ?? "A helper"} is doing your errand as a favour — no charge!`,
      data: { errandId },
    });
  } else {
    await notifyUser(state.requesterId, {
      title: "Helper found! 🎉",
      body: `A helper has accepted your errand: ${errand.title}`,
      data: { errandId },
    });
  }

  cleanupMatchingState(errandId);
};
