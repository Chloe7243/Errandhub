// All external I/O is mocked so the matching state machine runs in pure JS.
jest.mock("../../../apps/backend/src/lib/prisma", () => ({
  prisma: {
    errand: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    userSettings: {
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("../../../apps/backend/src/lib/socket", () => ({
  emitToUser: jest.fn(),
  getConnectedHelpers: jest.fn(),
}));

jest.mock("../../../apps/backend/src/lib/notifications", () => ({
  notifyUser: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../apps/backend/src/controllers/payment", () => ({
  authorizeErrandPayment: jest.fn().mockResolvedValue(undefined),
}));

import {
  startErrandMatching,
  helperAcceptErrand,
  helperDeclineErrand,
  helperCounterOffer,
  requestOfferResponse,
  confirmHelper,
} from "../../../apps/backend/src/services/matching";
import { prisma } from "../../../apps/backend/src/lib/prisma";
import { emitToUser, getConnectedHelpers } from "../../../apps/backend/src/lib/socket";
import { notifyUser } from "../../../apps/backend/src/lib/notifications";
import { authorizeErrandPayment } from "../../../apps/backend/src/controllers/payment";

const mockPrismaErrand = prisma.errand as jest.Mocked<typeof prisma.errand>;
const mockPrismaSettings = prisma.userSettings as jest.Mocked<typeof prisma.userSettings>;
const mockPrismaUser = prisma.user as jest.Mocked<typeof prisma.user>;
const mockEmit = emitToUser as jest.Mock;
const mockGetConnectedHelpers = getConnectedHelpers as jest.Mock;
const mockNotify = notifyUser as jest.Mock;
const mockAuthorize = authorizeErrandPayment as jest.Mock;

// Stable IDs used across tests.
const REQUESTER_ID = "requester-1";
const HELPER_ID = "helper-1";

// Each test gets a unique errand ID so module-level matchingState entries
// don't bleed across tests (Map is never fully reset between runs).
let errandIdCounter = 0;
const nextErrandId = () => `errand-${++errandIdCounter}`;

/** Build a minimal DB errand row. */
const makeDbErrand = (id: string, overrides: Record<string, any> = {}) => ({
  id,
  requesterId: REQUESTER_ID,
  helperId: null,
  type: "PICKUP_DELIVERY",
  status: "POSTED",
  title: "Pick up parcel",
  description: '["Collect from reception"]',
  firstLocation: "123 High St",
  finalLocation: "456 Park Rd",
  locationReference: null,
  suggestedPrice: 5,
  agreedPrice: null,
  finalCost: null,
  paymentMethodId: "pm_test",
  stripePaymentIntentId: null,
  startedAt: null,
  estimatedDuration: null,
  firstLat: 51.5,
  firstLng: -0.1,
  finalLat: 51.51,
  finalLng: -0.11,
  proofImageUrl: null,
  proofNote: null,
  completedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  requester: {
    id: REQUESTER_ID,
    firstName: "Alice",
    lastName: "Smith",
    avatarUrl: null,
  },
  ...overrides,
});

/**
 * Wire up the standard "happy path" prisma mocks so scheduleHelper can run
 * to completion with HELPER_ID selected. Returns the errand DB row.
 */
const setupSchedulerMocks = (errandId: string) => {
  const errand = makeDbErrand(errandId);
  // getErrand is called multiple times so mockResolvedValue (not Once) is used.
  mockPrismaErrand.findUnique.mockResolvedValue(errand as any);
  mockPrismaSettings.findMany.mockResolvedValue([
    { userId: HELPER_ID, notificationRadius: 5 },
  ] as any);
  mockGetConnectedHelpers.mockReturnValue([
    { userId: HELPER_ID, coordinates: { lat: 51.5, lng: -0.1 } },
  ]);
  // No helpers are currently busy.
  mockPrismaErrand.findMany.mockResolvedValue([]);
  return errand;
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
});

// ─── startErrandMatching ───────────────────────────────────────────────────

describe("startErrandMatching", () => {
  it("is a no-op when the errand is not POSTED", async () => {
    await startErrandMatching({
      id: nextErrandId(),
      requesterId: REQUESTER_ID,
      status: "IN_PROGRESS",
    });

    // scheduleHelper should never have run — no DB or socket calls expected.
    expect(mockGetConnectedHelpers).not.toHaveBeenCalled();
    expect(mockPrismaErrand.findUnique).not.toHaveBeenCalled();
  });

  it("emits errand_request to an eligible helper when the errand is POSTED", async () => {
    const errandId = nextErrandId();
    setupSchedulerMocks(errandId);

    await startErrandMatching({
      id: errandId,
      requesterId: REQUESTER_ID,
      status: "POSTED",
    });

    expect(mockEmit).toHaveBeenCalledWith(
      HELPER_ID,
      "errand_request",
      expect.objectContaining({ errandId }),
    );
  });

  it("expires the errand immediately when no helpers are connected", async () => {
    const errandId = nextErrandId();
    setupSchedulerMocks(errandId);
    // Override: no one connected.
    mockGetConnectedHelpers.mockReturnValue([]);

    await startErrandMatching({
      id: errandId,
      requesterId: REQUESTER_ID,
      status: "POSTED",
    });

    expect(mockPrismaErrand.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "EXPIRED" }),
      }),
    );
    // Requester should hear about the expiry.
    expect(mockEmit).toHaveBeenCalledWith(
      REQUESTER_ID,
      "errand_expired",
      expect.objectContaining({ errandId }),
    );
  });

  it("expires the errand when all connected helpers are busy", async () => {
    const errandId = nextErrandId();
    setupSchedulerMocks(errandId);
    // HELPER_ID is currently handling a different errand.
    mockPrismaErrand.findMany.mockResolvedValue([
      { helperId: HELPER_ID },
    ] as any);

    await startErrandMatching({
      id: errandId,
      requesterId: REQUESTER_ID,
      status: "POSTED",
    });

    expect(mockPrismaErrand.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "EXPIRED" }),
      }),
    );
  });
});

// ─── helperAcceptErrand ────────────────────────────────────────────────────

describe("helperAcceptErrand", () => {
  it("is a no-op when no matching state exists for the errand", async () => {
    // No startErrandMatching called for this ID.
    await helperAcceptErrand("ghost-errand", HELPER_ID);
    expect(mockPrismaErrand.findUnique).not.toHaveBeenCalled();
  });

  it("is a no-op when the caller is not the currently-selected helper", async () => {
    const errandId = nextErrandId();
    setupSchedulerMocks(errandId);
    await startErrandMatching({
      id: errandId,
      requesterId: REQUESTER_ID,
      status: "POSTED",
    });
    jest.clearAllMocks();

    // An impostor who was not pinged tries to accept.
    await helperAcceptErrand(errandId, "impostor");

    expect(mockPrismaErrand.update).not.toHaveBeenCalled();
  });

  it("assigns the errand to IN_PROGRESS and notifies both parties on valid accept", async () => {
    const errandId = nextErrandId();
    const errand = setupSchedulerMocks(errandId);
    await startErrandMatching({
      id: errandId,
      requesterId: REQUESTER_ID,
      status: "POSTED",
    });
    jest.clearAllMocks();

    // Seed prisma so confirmHelper can read the errand and update it.
    const updatedErrand = { ...errand, helperId: HELPER_ID, status: "IN_PROGRESS" };
    mockPrismaErrand.findUnique.mockResolvedValue(errand as any);
    mockPrismaErrand.update.mockResolvedValue(updatedErrand as any);

    await helperAcceptErrand(errandId, HELPER_ID);

    expect(mockPrismaErrand.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          helperId: HELPER_ID,
          status: "IN_PROGRESS",
        }),
      }),
    );
    // Both sides should receive the errand_assigned event.
    expect(mockEmit).toHaveBeenCalledWith(
      HELPER_ID,
      "errand_assigned",
      expect.objectContaining({ errandId }),
    );
    expect(mockEmit).toHaveBeenCalledWith(
      REQUESTER_ID,
      "errand_assigned",
      expect.objectContaining({ errandId }),
    );
  });
});

// ─── helperDeclineErrand ───────────────────────────────────────────────────

describe("helperDeclineErrand", () => {
  it("is a no-op when the decliner is not the selected helper", async () => {
    const errandId = nextErrandId();
    setupSchedulerMocks(errandId);
    await startErrandMatching({
      id: errandId,
      requesterId: REQUESTER_ID,
      status: "POSTED",
    });
    jest.clearAllMocks();

    await helperDeclineErrand(errandId, "not-selected-helper");

    // No re-scheduling should have happened.
    expect(mockPrismaErrand.findUnique).not.toHaveBeenCalled();
  });

  it("marks the helper as tried and re-runs scheduling", async () => {
    const errandId = nextErrandId();
    setupSchedulerMocks(errandId);
    await startErrandMatching({
      id: errandId,
      requesterId: REQUESTER_ID,
      status: "POSTED",
    });
    jest.clearAllMocks();

    // On the second scheduling pass, no untried helpers remain → expires.
    setupSchedulerMocks(errandId);
    // Override so HELPER_ID is still connected but now in triedHelperIds → 0 eligible.
    // Easiest way: return no connected helpers on second pass.
    mockGetConnectedHelpers.mockReturnValue([]);

    await helperDeclineErrand(errandId, HELPER_ID);

    // scheduleHelper ran again and expired the errand (no helpers left).
    expect(mockPrismaErrand.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "EXPIRED" }),
      }),
    );
  });
});

// ─── helperCounterOffer ────────────────────────────────────────────────────

describe("helperCounterOffer", () => {
  /** Seed state and return the errand id */
  const seed = async () => {
    const errandId = nextErrandId();
    const errand = setupSchedulerMocks(errandId);
    await startErrandMatching({
      id: errandId,
      requesterId: REQUESTER_ID,
      status: "POSTED",
    });
    jest.clearAllMocks();
    // Re-seed find for the counter-offer path.
    mockPrismaErrand.findUnique.mockResolvedValue(errand as any);
    mockPrismaUser.findUnique.mockResolvedValue({
      id: HELPER_ID,
      firstName: "Bob",
      lastName: "Jones",
      avatarUrl: null,
    } as any);
    mockPrismaErrand.count.mockResolvedValue(3);
    return { errandId, errand };
  };

  it("is a no-op when the amount is below the suggested price", async () => {
    const { errandId } = await seed();
    // suggestedPrice is 5 — offering 4 is below the floor.
    await helperCounterOffer(errandId, HELPER_ID, 4);
    expect(mockEmit).not.toHaveBeenCalledWith(
      REQUESTER_ID,
      "counter_offer",
      expect.anything(),
    );
  });

  it("is a no-op when the amount exceeds 2× the suggested price", async () => {
    const { errandId } = await seed();
    // suggestedPrice is 5 — 10.01 is above the 10.00 cap.
    await helperCounterOffer(errandId, HELPER_ID, 10.5);
    expect(mockEmit).not.toHaveBeenCalledWith(
      REQUESTER_ID,
      "counter_offer",
      expect.anything(),
    );
  });

  it("is a no-op when the amount is not a multiple of 0.50", async () => {
    const { errandId } = await seed();
    // 6.25 is valid range but not on a 50p boundary.
    await helperCounterOffer(errandId, HELPER_ID, 6.25);
    expect(mockEmit).not.toHaveBeenCalledWith(
      REQUESTER_ID,
      "counter_offer",
      expect.anything(),
    );
  });

  it("emits counter_offer to the requester for a valid amount", async () => {
    const { errandId } = await seed();
    // £7.50 is in range (5–10) and on a 50p boundary.
    await helperCounterOffer(errandId, HELPER_ID, 7.5);

    expect(mockEmit).toHaveBeenCalledWith(
      REQUESTER_ID,
      "counter_offer",
      expect.objectContaining({
        errandId,
        amount: 7.5,
      }),
    );
  });

  it("sends a push notification to the requester for a valid counter-offer", async () => {
    const { errandId } = await seed();
    await helperCounterOffer(errandId, HELPER_ID, 7.5);

    expect(mockNotify).toHaveBeenCalledWith(
      REQUESTER_ID,
      expect.objectContaining({ title: "Counter offer received" }),
    );
  });
});

// ─── requestOfferResponse ─────────────────────────────────────────────────

describe("requestOfferResponse", () => {
  /** Seed state up to a pending counter-offer and return the errand. */
  const seedWithOffer = async (amount = 7.5) => {
    const errandId = nextErrandId();
    const errand = setupSchedulerMocks(errandId);
    await startErrandMatching({
      id: errandId,
      requesterId: REQUESTER_ID,
      status: "POSTED",
    });
    jest.clearAllMocks();

    mockPrismaErrand.findUnique.mockResolvedValue(errand as any);
    mockPrismaUser.findUnique.mockResolvedValue({
      id: HELPER_ID,
      firstName: "Bob",
      lastName: "Jones",
      avatarUrl: null,
    } as any);
    mockPrismaErrand.count.mockResolvedValue(3);

    // Place the counter-offer so pendingOfferAmount is set in state.
    await helperCounterOffer(errandId, HELPER_ID, amount);
    jest.clearAllMocks();

    // Prep mocks for confirmHelper (called on accept).
    const updatedErrand = { ...errand, helperId: HELPER_ID, status: "IN_PROGRESS", agreedPrice: amount };
    mockPrismaErrand.findUnique.mockResolvedValue(errand as any);
    mockPrismaErrand.update.mockResolvedValue(updatedErrand as any);

    return { errandId, errand };
  };

  it("is a no-op when no matching state exists", async () => {
    await requestOfferResponse("ghost-errand", true);
    expect(mockPrismaErrand.update).not.toHaveBeenCalled();
  });

  it("assigns the errand at the offered amount when accepted", async () => {
    const { errandId } = await seedWithOffer(7.5);

    await requestOfferResponse(errandId, true);

    // confirmHelper should update the errand with agreedPrice = 7.5.
    expect(mockPrismaErrand.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          agreedPrice: 7.5,
          status: "IN_PROGRESS",
        }),
      }),
    );
  });

  it("emits offer_rejected to the helper and re-schedules when rejected", async () => {
    const { errandId } = await seedWithOffer(7.5);

    // On re-schedule: no connected helpers → expire.
    mockGetConnectedHelpers.mockReturnValue([]);
    mockPrismaSettings.findMany.mockResolvedValue([]);

    await requestOfferResponse(errandId, false);

    expect(mockEmit).toHaveBeenCalledWith(
      HELPER_ID,
      "offer_rejected",
      expect.objectContaining({ errandId }),
    );
  });
});

// ─── confirmHelper ────────────────────────────────────────────────────────

describe("confirmHelper", () => {
  it("is a no-op when there is no matching state", async () => {
    await confirmHelper("ghost-errand");
    expect(mockPrismaErrand.findUnique).not.toHaveBeenCalled();
  });

  it("transitions the errand to IN_PROGRESS and notifies both parties", async () => {
    const errandId = nextErrandId();
    const errand = setupSchedulerMocks(errandId);
    await startErrandMatching({
      id: errandId,
      requesterId: REQUESTER_ID,
      status: "POSTED",
    });
    jest.clearAllMocks();

    const updated = { ...errand, helperId: HELPER_ID, status: "IN_PROGRESS" };
    mockPrismaErrand.findUnique.mockResolvedValue(errand as any);
    mockPrismaErrand.update.mockResolvedValue(updated as any);

    await confirmHelper(errandId);

    expect(mockPrismaErrand.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          helperId: HELPER_ID,
          status: "IN_PROGRESS",
        }),
      }),
    );
    expect(mockEmit).toHaveBeenCalledWith(
      HELPER_ID,
      "errand_assigned",
      expect.objectContaining({ errandId }),
    );
    expect(mockEmit).toHaveBeenCalledWith(
      REQUESTER_ID,
      "errand_assigned",
      expect.objectContaining({ errandId }),
    );
    expect(mockNotify).toHaveBeenCalledWith(
      REQUESTER_ID,
      expect.objectContaining({ title: "Helper found! 🎉" }),
    );
  });

  it("attempts payment authorisation but does not throw if it fails", async () => {
    const errandId = nextErrandId();
    const errand = setupSchedulerMocks(errandId);
    await startErrandMatching({
      id: errandId,
      requesterId: REQUESTER_ID,
      status: "POSTED",
    });
    jest.clearAllMocks();

    const updated = { ...errand, helperId: HELPER_ID, status: "IN_PROGRESS" };
    mockPrismaErrand.findUnique.mockResolvedValue(errand as any);
    mockPrismaErrand.update.mockResolvedValue(updated as any);
    // Stripe/payment auth blows up — confirmHelper should swallow the error.
    mockAuthorize.mockRejectedValue(new Error("Stripe is down"));

    // Should not throw
    await expect(confirmHelper(errandId)).resolves.not.toThrow();
    expect(mockAuthorize).toHaveBeenCalled();
  });

  it("uses the counter-offer amount as agreedPrice when provided", async () => {
    const errandId = nextErrandId();
    const errand = setupSchedulerMocks(errandId);
    await startErrandMatching({
      id: errandId,
      requesterId: REQUESTER_ID,
      status: "POSTED",
    });
    jest.clearAllMocks();

    const updated = { ...errand, helperId: HELPER_ID, status: "IN_PROGRESS", agreedPrice: 8 };
    mockPrismaErrand.findUnique.mockResolvedValue(errand as any);
    mockPrismaErrand.update.mockResolvedValue(updated as any);

    await confirmHelper(errandId, 8);

    expect(mockPrismaErrand.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ agreedPrice: 8 }),
      }),
    );
  });
});
