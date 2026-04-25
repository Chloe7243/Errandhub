jest.mock("../../../apps/backend/src/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userSettings: {
      create: jest.fn(),
    },
  },
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue("mock-jwt"),
}));

jest.mock("../../../apps/backend/src/lib/nodemailer", () => ({
  sendEmail: jest.fn(),
}));

jest.mock("../../../apps/backend/src/emails", () => ({
  welcomeEmail: jest.fn().mockReturnValue("<html>welcome</html>"),
  resetPasswordEmail: jest.fn().mockReturnValue("<html>reset</html>"),
}));

import { Request, Response, NextFunction } from "express";
import {
  signUp,
  login,
  selectRole,
  forgetPassword,
  resetPassword,
} from "../../../apps/backend/src/controllers/auth";
import { prisma } from "../../../apps/backend/src/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "../../../apps/backend/src/middleware/errors";

// Typed handles to the mocked modules so TypeScript is happy with .mockResolvedValue etc.
const mockUser = prisma.user as jest.Mocked<typeof prisma.user>;
const mockSettings = prisma.userSettings as jest.Mocked<
  typeof prisma.userSettings
>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

/** Minimal req/res/next factory. Controllers only read body and params. */
const makeReq = (body = {}, params = {}): Request =>
  ({ body, params }) as unknown as Request;

const makeRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const next = jest.fn() as NextFunction;

/** A minimal user row as Prisma would return it. */
const dbUser = {
  id: "u1",
  firstName: "Alice",
  lastName: "Smith",
  email: "alice@uni.ac.uk",
  phone: "07700900000",
  avatarUrl: null,
  passwordHash: "hashed-password",
  resetToken: null,
  resetTokenExpiry: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = "test-secret";
});

afterAll(() => {
  delete process.env.JWT_SECRET;
});

// ─── signUp ────────────────────────────────────────────────────────────────

describe("signUp", () => {
  it("calls next(AppError 400) when the body fails schema validation", async () => {
    // Missing required fields → signUpSchema.safeParse fails
    const req = makeReq({ email: "bad", password: "x" });
    const res = makeRes();

    await signUp(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
  });

  it("calls next(AppError 400) when the email is already registered", async () => {
    mockUser.findUnique.mockResolvedValue(dbUser as any);
    mockBcrypt.hash.mockResolvedValue("hash" as never);

    const req = makeReq({
      firstName: "Alice",
      lastName: "Smith",
      email: "alice@uni.ac.uk",
      phone: "07700900000",
      password: "Password1!",
    });
    const res = makeRes();

    await signUp(req, res, next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
    expect(err.message).toMatch(/already in use/i);
  });

  it("responds 201 with a token and user on successful signup", async () => {
    mockUser.findUnique.mockResolvedValue(null);
    mockBcrypt.hash.mockResolvedValue("hashed-password" as never);
    mockUser.create.mockResolvedValue(dbUser as any);
    mockSettings.create.mockResolvedValue({} as any);
    mockJwt.sign.mockReturnValue("new-jwt" as any);

    const req = makeReq({
      firstName: "Alice",
      lastName: "Smith",
      email: "alice@uni.ac.uk",
      phone: "07700900000",
      password: "Password1!",
    });
    const res = makeRes();

    await signUp(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: "new-jwt" }),
    );
  });

  it("dispatches the welcome email fire-and-forget (sendEmail is called)", async () => {
    const { sendEmail } = require("../../../apps/backend/src/lib/nodemailer");
    mockUser.findUnique.mockResolvedValue(null);
    mockBcrypt.hash.mockResolvedValue("hash" as never);
    mockUser.create.mockResolvedValue(dbUser as any);
    mockSettings.create.mockResolvedValue({} as any);

    const req = makeReq({
      firstName: "Alice",
      lastName: "Smith",
      email: "alice@uni.ac.uk",
      phone: "07700900000",
      password: "Password1!",
    });
    await signUp(req, makeRes(), next);

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: dbUser.email }),
    );
  });
});

// ─── login ─────────────────────────────────────────────────────────────────

describe("login", () => {
  it("calls next(AppError 400) for invalid body", async () => {
    const req = makeReq({ email: "not-an-email" });
    await login(req, makeRes(), next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
  });

  it("calls next(AppError 401) when no user is found", async () => {
    mockUser.findUnique.mockResolvedValue(null);
    const req = makeReq({ email: "alice@uni.ac.uk", password: "Password1!" });
    await login(req, makeRes(), next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
    // Same message whether user doesn't exist or password is wrong — avoids email enumeration.
    expect(err.message).toMatch(/invalid credentials/i);
  });

  it("calls next(AppError 401) when the password does not match", async () => {
    mockUser.findUnique.mockResolvedValue(dbUser as any);
    mockBcrypt.compare.mockResolvedValue(false as never);

    const req = makeReq({ email: "alice@uni.ac.uk", password: "WrongPass1!" });
    await login(req, makeRes(), next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
    expect(err.message).toMatch(/invalid credentials/i);
  });

  it("responds 200 with a token on successful login", async () => {
    mockUser.findUnique.mockResolvedValue(dbUser as any);
    mockBcrypt.compare.mockResolvedValue(true as never);
    mockJwt.sign.mockReturnValue("login-jwt" as any);

    const req = makeReq({ email: "alice@uni.ac.uk", password: "Password1!" });
    const res = makeRes();
    await login(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: "login-jwt" }),
    );
  });
});

// ─── selectRole ────────────────────────────────────────────────────────────

describe("selectRole", () => {
  it("calls next(AppError 400) for an invalid role value", async () => {
    const req = makeReq({ role: "admin" }, { userId: "u1" });
    await selectRole(req, makeRes(), next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
  });

  it("calls next(AppError 401) when the user is not found", async () => {
    mockUser.findUnique.mockResolvedValue(null);
    const req = makeReq({ role: "helper" }, { userId: "ghost" });
    await selectRole(req, makeRes(), next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it("responds 200 with a role-scoped token on success", async () => {
    mockUser.findUnique.mockResolvedValue(dbUser as any);
    mockJwt.sign.mockReturnValue("role-jwt" as any);

    const req = makeReq({ role: "requester" }, { userId: "u1" });
    const res = makeRes();
    await selectRole(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        token: "role-jwt",
        user: expect.objectContaining({ role: "requester" }),
      }),
    );
  });
});

// ─── forgetPassword ────────────────────────────────────────────────────────

describe("forgetPassword", () => {
  it("calls next(AppError 400) when the email field is missing", async () => {
    const req = makeReq({});
    await forgetPassword(req, makeRes(), next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
  });

  it("calls next(AppError 404) when no account matches the email", async () => {
    mockUser.findUnique.mockResolvedValue(null);
    const req = makeReq({ email: "nobody@uni.ac.uk" });
    await forgetPassword(req, makeRes(), next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err.statusCode).toBe(404);
  });

  it("persists a reset token and responds 200 on success", async () => {
    mockUser.findUnique.mockResolvedValue(dbUser as any);
    mockUser.update.mockResolvedValue(dbUser as any);

    const req = makeReq({ email: "alice@uni.ac.uk" });
    const res = makeRes();
    await forgetPassword(req, res, next);

    expect(mockUser.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          resetToken: expect.any(String),
          resetTokenExpiry: expect.any(Date),
        }),
      }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ─── resetPassword ─────────────────────────────────────────────────────────

describe("resetPassword", () => {
  it("calls next(AppError 400) when schema validation fails", async () => {
    // Missing password field
    const req = makeReq({ token: "some-token" });
    await resetPassword(req, makeRes(), next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
  });

  it("calls next(AppError 400) when the token is invalid or expired", async () => {
    mockUser.findFirst.mockResolvedValue(null);

    const req = makeReq({ token: "expired-token", password: "NewPass1!" });
    await resetPassword(req, makeRes(), next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
    expect(err.message).toMatch(/invalid or expired/i);
  });

  it("writes the new password hash and nulls the token fields on success", async () => {
    mockUser.findFirst.mockResolvedValue(dbUser as any);
    mockBcrypt.hash.mockResolvedValue("new-hash" as never);
    mockUser.update.mockResolvedValue(dbUser as any);

    const req = makeReq({ token: "valid-token", password: "NewPass1!" });
    const res = makeRes();
    await resetPassword(req, res, next);

    expect(mockUser.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          passwordHash: "new-hash",
          resetToken: null,
          resetTokenExpiry: null,
        }),
      }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
