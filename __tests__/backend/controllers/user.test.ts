jest.mock("../../../apps/backend/src/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    errand: {
      findMany: jest.fn(),
    },
    userSettings: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

import { Response, NextFunction } from "express";
import {
  getUser,
  savePushToken,
  updateAvatar,
  getSettings,
  updateSettings,
  getRequestedErrands,
} from "../../../apps/backend/src/controllers/user";
import { prisma } from "../../../apps/backend/src/lib/prisma";
import { AuthRequest } from "../../../apps/backend/src/types/auth";
import { AppError } from "../../../apps/backend/src/middleware/errors";

const mockPrismaUser = prisma.user as jest.Mocked<typeof prisma.user>;
const mockPrismaErrand = prisma.errand as jest.Mocked<typeof prisma.errand>;
const mockPrismaSettings = prisma.userSettings as jest.Mocked<
  typeof prisma.userSettings
>;

/** Build a minimal AuthRequest with userId already set (as authMiddleware would). */
const makeReq = (overrides: Partial<AuthRequest> = {}): AuthRequest =>
  ({
    userId: "u1",
    body: {},
    params: {},
    query: {},
    headers: {},
    ...overrides,
  }) as unknown as AuthRequest;

const makeRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const next = jest.fn() as NextFunction;

const dbUser = {
  id: "u1",
  firstName: "Alice",
  lastName: "Smith",
  email: "alice@uni.ac.uk",
  phone: "07700900000",
  avatarUrl: null,
  university: null,
  isVerified: false,
  createdAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── getUser ───────────────────────────────────────────────────────────────

describe("getUser", () => {
  it("calls next(AppError 404) when the user is not found", async () => {
    mockPrismaUser.findUnique.mockResolvedValue(null);
    await getUser(makeReq(), makeRes(), next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(404);
  });

  it("responds 200 with the user object when found", async () => {
    mockPrismaUser.findUnique.mockResolvedValue(dbUser as any);
    const res = makeRes();

    await getUser(makeReq(), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ user: dbUser });
  });
});

// ─── savePushToken ─────────────────────────────────────────────────────────

describe("savePushToken", () => {
  it("calls next(AppError 400) when no token is provided", async () => {
    const req = makeReq({ body: {} });
    await savePushToken(req, makeRes(), next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
  });

  it("updates the user row and responds 200 on success", async () => {
    mockPrismaUser.update.mockResolvedValue({} as any);
    const req = makeReq({ body: { token: "ExponentPushToken[xxx]" } });
    const res = makeRes();

    await savePushToken(req, res, next);

    expect(mockPrismaUser.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
        data: { expoPushToken: "ExponentPushToken[xxx]" },
      }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ─── updateAvatar ──────────────────────────────────────────────────────────

describe("updateAvatar", () => {
  it("calls next(AppError 400) when avatarUrl is missing from the body", async () => {
    const req = makeReq({ body: {} });
    await updateAvatar(req, makeRes(), next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
  });

  it("updates the avatar URL and responds 200 with the new URL", async () => {
    const newUrl = "https://cdn.example.com/avatar.jpg";
    mockPrismaUser.update.mockResolvedValue({ avatarUrl: newUrl } as any);

    const req = makeReq({ body: { avatarUrl: newUrl } });
    const res = makeRes();

    await updateAvatar(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ avatarUrl: newUrl });
  });
});

// ─── getSettings ───────────────────────────────────────────────────────────

describe("getSettings", () => {
  it("responds 200 with null settings when the row does not exist yet", async () => {
    mockPrismaSettings.findUnique.mockResolvedValue(null);
    const res = makeRes();

    await getSettings(makeReq(), res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ settings: null });
  });

  it("responds 200 with the settings row when it exists", async () => {
    const settings = { userId: "u1", isAvailable: true, notificationRadius: 2 };
    mockPrismaSettings.findUnique.mockResolvedValue(settings as any);
    const res = makeRes();

    await getSettings(makeReq(), res, next);

    expect(res.json).toHaveBeenCalledWith({ settings });
  });
});

// ─── updateSettings ────────────────────────────────────────────────────────

describe("updateSettings", () => {
  it("upserts settings and responds 200 on success", async () => {
    const updatedSettings = {
      userId: "u1",
      isAvailable: true,
      notificationRadius: 5,
      errandUpdates: true,
      newMessages: true,
    };
    mockPrismaSettings.upsert.mockResolvedValue(updatedSettings as any);

    const req = makeReq({ body: { isAvailable: true, notificationRadius: 5 } });
    const res = makeRes();

    await updateSettings(req, res, next);

    expect(mockPrismaSettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "u1" } }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ settings: updatedSettings }),
    );
  });
});

// ─── getRequestedErrands ───────────────────────────────────────────────────

describe("getRequestedErrands", () => {
  const errands = [
    { status: "POSTED" },
    { status: "IN_PROGRESS" },
    { status: "COMPLETED" },
  ];

  it("responds 200 with errands and a computed summary", async () => {
    // First findMany call returns status-only rows for the summary calculation;
    // the second returns the full errand list.
    mockPrismaErrand.findMany
      .mockResolvedValueOnce(errands as any)
      .mockResolvedValueOnce(errands as any);

    const res = makeRes();
    await getRequestedErrands(makeReq(), res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    const { summary } = (res.json as jest.Mock).mock.calls[0][0];
    expect(summary.totalActive).toBe(2); // POSTED + IN_PROGRESS
    expect(summary.totalCompleted).toBe(1);
    expect(summary.totalErrands).toBe(3);
  });
});
