import { Errand } from "../../generated/prisma";
import { prisma } from "../lib/prisma";
import { emitToUser, getConnectedHelpers } from "../lib/socket";

type MatchingState = {
  errandId: string;
  requesterId: string;
  triedHelperIds: Set<string>;
  currentHelperId?: string;
  responseTimer?: NodeJS.Timeout;
  reviewTimer?: NodeJS.Timeout;
  offerTimer?: NodeJS.Timeout;
  pendingOfferAmount?: number;
};

const matchingState = new Map<string, MatchingState>();

const FIVE_MINUTES = 5 * 60 * 1000;
const FIFTEEN_SECONDS = 15 * 1000;
const SIXTY_SECONDS = 60 * 1000;

const clearTimers = (state: MatchingState) => {
  if (state.responseTimer) {
    clearTimeout(state.responseTimer);
    state.responseTimer = undefined;
  }
  if (state.reviewTimer) {
    clearTimeout(state.reviewTimer);
    state.reviewTimer = undefined;
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

const getSocketPayloadForErrand = async (errandId: string) => {
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
    data: { status: "EXPIRED", helperId: null, reviewWindowExpiresAt: null },
  });

  const errand = await getSocketPayloadForErrand(errandId);
  if (errand?.requester) {
    emitToUser(errand.requester.id, "errand_expired", { errandId });
  }

  cleanupMatchingState(errandId);
};

const scheduleNextHelper = async (errandId: string) => {
  const state = matchingState.get(errandId);
  if (!state) return;

  const errand = await prisma.errand.findUnique({
    where: { id: errandId },
  });

  if (!errand || errand.status !== "POSTED") {
    cleanupMatchingState(errandId);
    return;
  }

  const availableHelperIds = (
    await prisma.userSettings.findMany({
      where: {
        isAvailable: true,
        userId: { not: errand.requesterId },
      },
      select: {
        userId: true,
      },
    })
  ).map((setting) => setting.userId);

  const connectedHelperIds = getConnectedHelpers().filter((helperId) =>
    availableHelperIds.includes(helperId),
  );

  if (connectedHelperIds.length === 0) {
    await expireErrand(errandId);
    return;
  }

  const busyHelpers = await prisma.errand.findMany({
    where: {
      helperId: { in: connectedHelperIds },
      status: { in: ["ACCEPTED", "IN_PROGRESS", "REVIEWING"] },
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

  const nextHelperId =
    eligibleHelpers[Math.floor(Math.random() * eligibleHelpers.length)];
  state.currentHelperId = nextHelperId;

  const errandDetails = await prisma.errand.findUnique({
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
  if (!errandDetails || !errandDetails.requester) {
    await expireErrand(errandId);
    return;
  }

  emitToUser(nextHelperId, "errand_request", {
    errand: {
      id: errandDetails.id,
      title: errandDetails.title,
      description: errandDetails.description,
      pickupLocation: errandDetails.pickupLocation,
      dropoffLocation: errandDetails.dropoffLocation,
      pickupReference: errandDetails.pickupReference,
      suggestedPrice: errandDetails.suggestedPrice,
      type: errandDetails.type,
      requester: {
        id: errandDetails.requester.id,
        firstName: errandDetails.requester.firstName,
        lastName: errandDetails.requester.lastName,
        avatarUrl: errandDetails.requester.avatarUrl,
      },
      expiresAt: new Date(Date.now() + FIVE_MINUTES).toISOString(),
    },
  });

  state.responseTimer = setTimeout(() => {
    if (state.currentHelperId) {
      state.triedHelperIds.add(state.currentHelperId);
    }
    state.currentHelperId = undefined;
    scheduleNextHelper(errandId);
  }, FIVE_MINUTES);
};

const sendReviewWindow = async (
  errandId: string,
  helperId: string,
  agreedPrice: number,
) => {
  const helperProfile = await getHelperProfile(helperId);
  if (!helperProfile) return;

  await prisma.errand.update({
    where: { id: errandId },
    data: {
      status: "TENTATIVELY_ACCEPTED",
      helperId,
      agreedPrice,
      reviewWindowExpiresAt: new Date(Date.now() + FIFTEEN_SECONDS),
      consecutiveCancels: 0,
    },
  });

  const errand = await getSocketPayloadForErrand(errandId);
  if (!errand?.requester) {
    cleanupMatchingState(errandId);
    return;
  }

  emitToUser(errand.requester.id, "review_window", {
    errandId,
    helper: helperProfile,
    agreedPrice,
    expiresAt: new Date(Date.now() + FIFTEEN_SECONDS).toISOString(),
  });

  const state = matchingState.get(errandId);
  if (!state) return;
  if (state.responseTimer) {
    clearTimeout(state.responseTimer);
    state.responseTimer = undefined;
  }
  state.reviewTimer = setTimeout(() => {
    confirmHelper(errandId);
  }, FIFTEEN_SECONDS);
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

  await scheduleNextHelper(errand.id);
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
  await sendReviewWindow(errandId, helperId, errand.suggestedPrice ?? 0);
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

  const minAmount = errand.suggestedPrice ?? 0;
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
    scheduleNextHelper(errandId);
  }, SIXTY_SECONDS);

  const helperProfile = await getHelperProfile(helperId);
  const errandDetails = await getSocketPayloadForErrand(errandId);
  if (!helperProfile || !errandDetails?.requester) {
    return;
  }

  emitToUser(errandDetails.requester.id, "counter_offer", {
    errandId,
    helper: helperProfile,
    amount,
    expiresAt: new Date(Date.now() + SIXTY_SECONDS).toISOString(),
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
    await sendReviewWindow(errandId, state.currentHelperId, amount);
    state.pendingOfferAmount = undefined;
    return;
  }

  state.triedHelperIds.add(state.currentHelperId);
  state.currentHelperId = undefined;
  state.pendingOfferAmount = undefined;
  await scheduleNextHelper(errandId);
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
  await scheduleNextHelper(errandId);
};

export const confirmHelper = async (errandId: string) => {
  const state = matchingState.get(errandId);
  if (!state || !state.currentHelperId) return;

  const errand = await prisma.errand.findUnique({ where: { id: errandId } });
  if (!errand || errand.status !== "TENTATIVELY_ACCEPTED") {
    cleanupMatchingState(errandId);
    return;
  }

  if (state.reviewTimer) {
    clearTimeout(state.reviewTimer);
    state.reviewTimer = undefined;
  }

  const updated = await prisma.errand.update({
    where: { id: errandId },
    data: {
      status: "ACCEPTED",
      reviewWindowExpiresAt: null,
      consecutiveCancels: 0,
    },
  });

  emitToUser(state.currentHelperId, "errand_assigned", {
    errandId: updated.id,
  });

  cleanupMatchingState(errandId);
};

export const cancelReview = async (errandId: string) => {
  const state = matchingState.get(errandId);
  if (!state || !state.currentHelperId) return;

  const errand = await prisma.errand.findUnique({ where: { id: errandId } });
  if (!errand || errand.status !== "TENTATIVELY_ACCEPTED") return;

  if (state.reviewTimer) {
    clearTimeout(state.reviewTimer);
    state.reviewTimer = undefined;
  }

  await prisma.errand.update({
    where: { id: errandId },
    data: {
      status: "POSTED",
      helperId: null,
      reviewWindowExpiresAt: null,
      consecutiveCancels: {
        increment: 1,
      },
    },
  });

  emitToUser(state.currentHelperId, "match_unavailable", {
    errandId,
    message: "The requester cancelled the review window.",
  });

  state.triedHelperIds.add(state.currentHelperId);
  state.currentHelperId = undefined;
  await scheduleNextHelper(errandId);
};
