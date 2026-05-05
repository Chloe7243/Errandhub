/// <reference types="jest" />

jest.mock("../../../apps/backend/src/lib/prisma", () => ({
  prisma: {
    errand: {
      findUnique: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    dispute: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock("../../../apps/backend/src/services/matching", () => ({
  startErrandMatching: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../apps/backend/src/lib/socket", () => ({
  emitToUser: jest.fn(),
}));

jest.mock("../../../apps/backend/src/lib/notifications", () => ({
  notifyUser: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../apps/backend/src/lib/stripe", () => ({
  stripe: {
    paymentIntents: {
      capture: jest.fn().mockResolvedValue({}),
      cancel: jest.fn().mockResolvedValue({}),
    },
  },
}));

import { Response, NextFunction } from "express";
import {
  createErrand,
  getErrandById,
  startWork,
  extendWork,
  updateErrandStatus,
  raiseDispute,
} from "../../../apps/backend/src/controllers/errand";
import { prisma } from "../../../apps/backend/src/lib/prisma";
import { AuthRequest } from "../../../apps/backend/src/types/auth";
import { AppError } from "../../../apps/backend/src/middleware/errors";

const mockErrand = prisma.errand as jest.Mocked<typeof prisma.errand>;
const mockTx = prisma.$transaction as jest.Mock;

const makeReq = <P extends Record<string, string> = Record<string, string>>(
  overrides: Partial<AuthRequest<P>> = {},
): AuthRequest<P> =>
  ({
    userId: "requester-1",
    role: "requester",
    body: {},
    params: {} as P,
    query: {},
    headers: {},
    ...overrides,
  }) as unknown as AuthRequest<P>;

const makeRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const next = jest.fn() as jest.Mock<any, any>;

/** A fully-populated errand row as Prisma would return it. */
const dbErrand = {
  id: "e1",
  requesterId: "requester-1",
  helperId: "helper-1",
  type: "PICKUP_DELIVERY",
  status: "IN_PROGRESS",
  title: "Pick up parcel",
  description: '["Collect from reception"]',
  firstLocation: "123 High St",
  finalLocation: "456 Park Rd",
  locationReference: null,
  suggestedPrice: 5,
  agreedPrice: null,
  finalCost: null,
  paymentMethodId: "pm_test_123",
  stripePaymentIntentId: null,
  startedAt: null,
  estimatedDuration: 2,
  firstLat: 51.5,
  firstLng: -0.1,
  finalLat: 51.51,
  finalLng: -0.11,
  proofImageUrl: null,
  proofNote: null,
  completedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── createErrand ──────────────────────────────────────────────────────────

describe("createErrand", () => {
  const validBody = {
    title: "Pick up parcel",
    description: '["Collect from reception"]',
    firstLocation: "123 High St",
    finalLocation: "456 Park Rd",
    type: "PICKUP_DELIVERY",
    firstLat: 51.5,
    firstLng: -0.1,
    finalLat: 51.51,
    finalLng: -0.11,
    paymentMethodId: "pm_test_123",
  };

  it("calls next(AppError 400) when the body fails schema validation", async () => {
    // Missing required fields (title, firstLocation, type…)
    const req = makeReq({ body: { paymentMethodId: "pm_test_123" } });
    await createErrand(req, makeRes(), next);

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
  });

  it("calls next(AppError 400) when paymentMethodId is absent", async () => {
    const { paymentMethodId: _, ...bodyWithoutPayment } = validBody;
    const req = makeReq({ body: bodyWithoutPayment });

    await createErrand(req, makeRes(), next);

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toMatch(/payment method/i);
  });

  it("calls next(AppError 400) when the requester already has 3 active errands", async () => {
    mockErrand.count.mockResolvedValue(3);
    const req = makeReq({ body: validBody });

    await createErrand(req, makeRes(), next);

    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(400);
    expect(err.message).toMatch(/3 active/i);
  });

  it("creates the errand and responds 201 on success", async () => {
    mockErrand.count.mockResolvedValue(0);
    mockErrand.create.mockResolvedValue(dbErrand as any);
    const {
      startErrandMatching,
    } = require("../../../apps/backend/src/services/matching");

    const req = makeReq({ body: validBody });
    const res = makeRes();

    await createErrand(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(mockErrand.create).toHaveBeenCalledTimes(1);
    expect(startErrandMatching).toHaveBeenCalledWith(dbErrand);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ errand: dbErrand }),
    );
  });
});

// ─── getErrandById ─────────────────────────────────────────────────────────

describe("getErrandById", () => {
  it("calls next(AppError 404) when the errand does not exist", async () => {
    mockErrand.findUnique.mockResolvedValue(null);
    const req = makeReq({ params: { id: "missing" } });

    await getErrandById(req, makeRes(), next);

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(404);
  });

  it("responds 200 with the errand when found", async () => {
    mockErrand.findUnique.mockResolvedValue(dbErrand as any);
    const req = makeReq({ params: { id: "e1" } });
    const res = makeRes();

    await getErrandById(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ─── startWork ─────────────────────────────────────────────────────────────

describe("startWork", () => {
  const handsOnErrand = {
    ...dbErrand,
    type: "HANDS_ON_HELP",
    status: "IN_PROGRESS",
    startedAt: null,
  };

  it("calls next(AppError 400) for non-HANDS_ON_HELP errands", async () => {
    mockErrand.findUnique.mockResolvedValue({
      ...dbErrand,
      type: "PICKUP_DELIVERY",
    } as any);
    await startWork(makeReq({ params: { id: "e1" } }), makeRes(), next);

    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(400);
    expect(err.message).toMatch(/hands-on help/i);
  });

  it("calls next(AppError 403) when the caller is not the assigned helper", async () => {
    mockErrand.findUnique.mockResolvedValue(handsOnErrand as any);
    // A different user is trying to start the work
    const req = makeReq({ userId: "impostor", params: { id: "e1" } });
    await startWork(req, makeRes(), next);

    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(403);
  });

  it("calls next(AppError 400) when the errand is not IN_PROGRESS", async () => {
    mockErrand.findUnique.mockResolvedValue({
      ...handsOnErrand,
      status: "POSTED",
    } as any);
    const req = makeReq({ userId: "helper-1", params: { id: "e1" } });
    await startWork(req, makeRes(), next);

    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(400);
    expect(err.message).toMatch(/not in progress/i);
  });

  it("calls next(AppError 400) when work has already been started", async () => {
    mockErrand.findUnique.mockResolvedValue({
      ...handsOnErrand,
      startedAt: new Date(),
    } as any);
    const req = makeReq({ userId: "helper-1", params: { id: "e1" } });
    await startWork(req, makeRes(), next);

    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(400);
    expect(err.message).toMatch(/already started/i);
  });

  it("sets startedAt and responds 200 on success", async () => {
    mockErrand.findUnique.mockResolvedValue(handsOnErrand as any);
    const updatedErrand = { ...handsOnErrand, startedAt: new Date() };
    mockErrand.update.mockResolvedValue(updatedErrand as any);

    const req = makeReq({ userId: "helper-1", params: { id: "e1" } });
    const res = makeRes();
    await startWork(req, res, next);

    expect(mockErrand.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ startedAt: expect.any(Date) }),
      }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ─── extendWork ────────────────────────────────────────────────────────────

describe("extendWork", () => {
  const startedErrand = {
    ...dbErrand,
    type: "HANDS_ON_HELP",
    status: "IN_PROGRESS",
    startedAt: new Date(),
  };

  it("calls next(AppError 400) when additionalHours is invalid (> 8)", async () => {
    const req = makeReq({
      userId: "helper-1",
      params: { id: "e1" },
      body: { additionalHours: 9 },
    });
    await extendWork(req, makeRes(), next);

    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it("calls next(AppError 400) when work has not been started yet", async () => {
    mockErrand.findUnique.mockResolvedValue({
      ...startedErrand,
      startedAt: null,
    } as any);
    const req = makeReq({
      userId: "helper-1",
      params: { id: "e1" },
      body: { additionalHours: 1 },
    });
    await extendWork(req, makeRes(), next);

    const err = next.mock.calls[0][0];
    expect(err.message).toMatch(/not been started/i);
  });

  it("adds hours to estimatedDuration and responds 200", async () => {
    mockErrand.findUnique.mockResolvedValue(startedErrand as any);
    mockErrand.update.mockResolvedValue({
      ...startedErrand,
      estimatedDuration: 3,
    } as any);

    const req = makeReq({
      userId: "helper-1",
      params: { id: "e1" },
      body: { additionalHours: 1 },
    });
    const res = makeRes();
    await extendWork(req, res, next);

    expect(mockErrand.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { estimatedDuration: 3 }, // original 2 + 1
      }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ─── updateErrandStatus ────────────────────────────────────────────────────

describe("updateErrandStatus", () => {
  it("calls next(AppError 400) for an illegal status transition", async () => {
    // COMPLETED → anything is not in the allowedTransitions table
    mockErrand.findUnique.mockResolvedValue({
      ...dbErrand,
      status: "COMPLETED",
    } as any);
    const req = makeReq({
      params: { id: "e1" },
      body: { status: "CANCELLED" },
    });
    await updateErrandStatus(req, makeRes(), next);

    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(400);
    expect(err.message).toMatch(/cannot move/i);
  });

  it("calls next(AppError 403) when a non-helper tries to move to REVIEWING", async () => {
    mockErrand.findUnique.mockResolvedValue(dbErrand as any); // helperId: helper-1
    // userId is different from helperId
    const req = makeReq({
      userId: "requester-1",
      params: { id: "e1" },
      body: { status: "REVIEWING" },
    });
    await updateErrandStatus(req, makeRes(), next);

    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(403);
  });

  it("calls next(AppError 403) when a non-requester tries to COMPLETE", async () => {
    mockErrand.findUnique.mockResolvedValue({
      ...dbErrand,
      status: "REVIEWING",
    } as any);
    const req = makeReq({
      userId: "helper-1", // not the requester
      params: { id: "e1" },
      body: { status: "COMPLETED" },
    });
    await updateErrandStatus(req, makeRes(), next);

    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(403);
  });

  it("updates status to REVIEWING and responds 200 for the assigned helper", async () => {
    mockErrand.findUnique.mockResolvedValue(dbErrand as any);
    mockErrand.update.mockResolvedValue({
      ...dbErrand,
      status: "REVIEWING",
    } as any);

    const req = makeReq({
      userId: "helper-1",
      params: { id: "e1" },
      body: { status: "REVIEWING" },
    });
    const res = makeRes();
    await updateErrandStatus(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("calls stripe.capture and responds 200 when the requester marks COMPLETED", async () => {
    const { stripe } = require("../../../apps/backend/src/lib/stripe");
    const reviewingErrand = {
      ...dbErrand,
      status: "REVIEWING",
      stripePaymentIntentId: "pi_test",
    };
    mockErrand.findUnique.mockResolvedValue(reviewingErrand as any);
    mockErrand.update.mockResolvedValue({
      ...reviewingErrand,
      status: "COMPLETED",
    } as any);

    const req = makeReq({
      userId: "requester-1",
      params: { id: "e1" },
      body: { status: "COMPLETED" },
    });
    const res = makeRes();
    await updateErrandStatus(req, res, next);

    expect(stripe.paymentIntents.capture).toHaveBeenCalledWith(
      "pi_test",
      expect.anything(),
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ─── raiseDispute ──────────────────────────────────────────────────────────

describe("raiseDispute", () => {
  const reviewingErrand = { ...dbErrand, status: "REVIEWING" };

  it("calls next(AppError 400) when reason or explanation are missing", async () => {
    const req = makeReq({
      params: { id: "e1" },
      body: { reason: "WRONG_ITEM" }, // missing explanation
    });
    await raiseDispute(req, makeRes(), next);

    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it("calls next(AppError 400) when the errand is not in REVIEWING state", async () => {
    mockErrand.findUnique.mockResolvedValue({
      ...dbErrand,
      status: "IN_PROGRESS",
    } as any);
    const req = makeReq({
      userId: "requester-1",
      params: { id: "e1" },
      body: { reason: "WRONG_ITEM", explanation: "It was the wrong item" },
    });
    await raiseDispute(req, makeRes(), next);

    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it("calls next(AppError 403) when the caller is not the requester", async () => {
    mockErrand.findUnique.mockResolvedValue(reviewingErrand as any);
    const req = makeReq({
      userId: "helper-1", // helper cannot raise a dispute
      params: { id: "e1" },
      body: { reason: "WRONG_ITEM", explanation: "It was the wrong item" },
    });
    await raiseDispute(req, makeRes(), next);

    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(403);
  });

  it("creates a dispute inside a transaction and responds 201 on success", async () => {
    mockErrand.findUnique.mockResolvedValue(reviewingErrand as any);
    const mockDisputeRow = { id: "d1", errandId: "e1", reason: "WRONG_ITEM" };
    // $transaction receives a callback — invoke it with a mock tx so the create runs
    mockTx.mockImplementation(async (fn: Function) => {
      const tx = {
        dispute: { create: jest.fn().mockResolvedValue(mockDisputeRow) },
        errand: { update: jest.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    });

    const req = makeReq({
      userId: "requester-1",
      params: { id: "e1" },
      body: { reason: "WRONG_ITEM", explanation: "It was the wrong item" },
    });
    const res = makeRes();
    await raiseDispute(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ dispute: mockDisputeRow });
  });
});
