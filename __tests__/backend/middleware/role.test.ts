import { requireRole } from "../../../apps/backend/src/middleware/role";
import { AppError } from "../../../apps/backend/src/middleware/errors";
import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../apps/backend/src/types/auth";
import { Role } from "../../../shared/schemas/roles";

const mockRes = {} as Response;
const next = jest.fn() as jest.Mock<any, any>;

/** Build a fake AuthRequest with the given role already set (as authMiddleware would). */
const makeReq = (role?: string): AuthRequest => ({ role }) as AuthRequest;

beforeEach(() => {
  next.mockClear();
});

describe("requireRole", () => {
  it("calls next() without an error when the roles match", () => {
    const middleware = requireRole("requester");
    const req = makeReq("requester");

    middleware(req, mockRes, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(/* no argument */);
    expect(next.mock.calls[0][0]).toBeUndefined();
  });

  it("throws an AppError(403) when the role does not match", () => {
    const middleware = requireRole("helper");
    const req = makeReq("requester");

    expect(() => middleware(req, mockRes, next)).toThrow(AppError);
    expect(() => middleware(req, mockRes, next)).toThrow(
      "Only helpers can perform this action",
    );
  });

  it("throws an AppError with statusCode 403 on mismatch", () => {
    const middleware = requireRole("requester");
    const req = makeReq("helper");

    try {
      middleware(req, mockRes, next);
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(403);
    }
  });

  it("throws when req.role is undefined (unauthenticated request slips through)", () => {
    const middleware = requireRole("helper");
    const req = makeReq(undefined);

    expect(() => middleware(req, mockRes, next)).toThrow(AppError);
  });

  it.each<Role>(["helper", "requester"])(
    "allows a '%s' through when the factory is configured for '%s'",
    (role) => {
      const middleware = requireRole(role);
      const req = makeReq(role);

      middleware(req, mockRes, next);

      expect(next.mock.calls[0][0]).toBeUndefined();
    },
  );
});
