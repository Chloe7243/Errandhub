import jwt from "jsonwebtoken";
import authMiddleware from "../../../apps/backend/src/middleware/auth";
import { AppError } from "../../../apps/backend/src/middleware/errors";
import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../apps/backend/src/types/auth";

/** Minimal mock Response — authMiddleware never writes to it directly. */
const mockRes = {} as Response;

/** Build a fake AuthRequest with the provided Authorization header value. */
const makeReq = (authHeader?: string): AuthRequest => {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  } as AuthRequest;
};

const JWT_SECRET = "test-secret";

beforeEach(() => {
  process.env.JWT_SECRET = JWT_SECRET;
});

afterEach(() => {
  delete process.env.JWT_SECRET;
  jest.restoreAllMocks();
});

describe("authMiddleware", () => {
  it("calls next() and attaches userId + role for a valid token", () => {
    const token = jwt.sign(
      { userId: "u1", role: "requester" },
      JWT_SECRET,
    );
    const req = makeReq(`Bearer ${token}`);
    const next = jest.fn();

    authMiddleware(req, mockRes, next);

    expect(next).toHaveBeenCalledWith(/* nothing — no error */);
    expect(next).toHaveBeenCalledTimes(1);
    // Ensure next() was called without an error argument
    expect(next.mock.calls[0][0]).toBeUndefined();
    expect(req.userId).toBe("u1");
    expect(req.role).toBe("requester");
  });

  it("passes an AppError(401) to next when the Authorization header is missing", () => {
    const req = makeReq(); // no header
    const next = jest.fn() as NextFunction;

    authMiddleware(req, mockRes, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).statusCode).toBe(401);
  });

  it("passes an AppError(401) to next when the scheme is not Bearer", () => {
    const token = jwt.sign({ userId: "u1", role: "helper" }, JWT_SECRET);
    const req = makeReq(`Token ${token}`);
    const next = jest.fn() as NextFunction;

    authMiddleware(req, mockRes, next);

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).statusCode).toBe(401);
  });

  it("passes an AppError(401) to next for an expired token", () => {
    // expiresIn: 0 creates an already-expired token
    const token = jwt.sign({ userId: "u1", role: "helper" }, JWT_SECRET, {
      expiresIn: 0,
    });
    const req = makeReq(`Bearer ${token}`);
    const next = jest.fn() as NextFunction;

    authMiddleware(req, mockRes, next);

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).statusCode).toBe(401);
  });

  it("passes an AppError(401) to next when the token is signed with the wrong secret", () => {
    const token = jwt.sign({ userId: "u1", role: "helper" }, "wrong-secret");
    const req = makeReq(`Bearer ${token}`);
    const next = jest.fn() as NextFunction;

    authMiddleware(req, mockRes, next);

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).statusCode).toBe(401);
  });

  it("passes an AppError(401) to next for an obviously malformed token string", () => {
    const req = makeReq("Bearer not.a.jwt");
    const next = jest.fn() as NextFunction;

    authMiddleware(req, mockRes, next);

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).statusCode).toBe(401);
  });
});
