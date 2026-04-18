import { prisma } from "../lib/prisma";
import { Errand } from "../../generated/prisma";
import { activeStatuses } from "@errandhub/shared";
import { emitToUser, getConnectedHelpers } from "../lib/socket";
import { notifyUser } from "../lib/notifications";
import { authorizeErrandPayment } from "../controllers/payment";

// formula to calculate short distance between 2 points in km
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

type MatchingState = {
  errandId: string;
  requesterId: string;
  triedHelperIds: Set<string>;
  currentHelperId?: string;
  responseTimer?: NodeJS.Timeout;
  offerTimer?: NodeJS.Timeout;
  pendingOfferAmount?: number;
};

const matchingState = new Map<string, MatchingState>();

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

  // Filter by notification radius when both the helper and errand have coordinates
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

  if (connectedHelperIds.length === 0) {
    await expireErrand(errandId);
    return;
  }

  const busyHelpers = await prisma.errand.findMany({
    where: {
      helperId: { in: connectedHelperIds },
      status: { in: activeStatuses },
    },
    select: { helperId: true },
  });
  const busyHelperIds = new Set(busyHelpers.map((item) => item.helperId));

  const eligibleHelpers = connectedHelperIds.filter(
    (helperId) =>
      !busyHelperIds.has(helperId) && !state.triedHelperIds.has(helperId),
  );

  if (eligibleHelpers.length === 0) {
    await expireErrand(errandId);
    return;
  }

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

export const helperAcceptErrand = async (
  errandId: string,
  helperId: string,
) => {
  const state = matchingState.get(errandId);
  if (!state || state.currentHelperId !== helperId) return;

  const errand = await prisma.errand.findUnique({ where: { id: errandId } });
  if (!errand || errand.status !== "POSTED") return;

  clearTimers(state);
  confirmHelper(errandId);
};

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
  const maxAmount = minAmount * 2;
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
    title: "Counter offer received 💬",
    body: `${helperProfile.firstName} offered £${amount.toFixed(2)} for your errand`,
    data: { errandId },
  });
};

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

export const confirmHelper = async (errandId: string, amount?: number) => {
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
      agreedPrice: amount ?? errand.suggestedPrice,
      status: "IN_PROGRESS",
    },
  });

  try {
    await authorizeErrandPayment(updated);
  } catch (err) {
    console.error("Payment authorization failed in matching:", err);
  }

  emitToUser(state.currentHelperId, "errand_assigned", {
    errandId: updated.id,
  });
  emitToUser(state.requesterId, "errand_assigned", {
    errandId: updated.id,
  });

  await notifyUser(state.requesterId, {
    title: "Helper found! 🎉",
    body: `A helper has accepted your errand: ${errand.title}`,
    data: { errandId },
  });

  cleanupMatchingState(errandId);
};
