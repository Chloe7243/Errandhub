import {
  AppError,
  errorHandler,
} from "../../../apps/backend/src/middleware/errors";
import { Request, Response, NextFunction } from "express";

/** Build a minimal mock Response with a chainable status().json() pair. */
const makeRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = {} as Request;
const next = jest.fn() as jest.Mock<any, any>;

describe("AppError", () => {
  it("is an instance of Error", () => {
    const err = new AppError("Not found", 404);
    expect(err).toBeInstanceOf(Error);
  });

  it("stores the message and statusCode passed to the constructor", () => {
    const err = new AppError("Forbidden", 403);
    expect(err.message).toBe("Forbidden");
    expect(err.statusCode).toBe(403);
  });

  it("can be caught as an Error", () => {
    expect(() => {
      throw new AppError("Bad request", 400);
    }).toThrow("Bad request");
  });
});

describe("errorHandler", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("responds with the AppError's own status code and message", () => {
    const res = makeRes();
    const err = new AppError("Resource not found", 404);

    errorHandler(err, mockReq, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Resource not found" });
  });

  it("responds 401 for an Unauthorised AppError", () => {
    const res = makeRes();
    errorHandler(new AppError("Unauthorised", 401), mockReq, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorised" });
  });

  it("responds 500 with a generic message for an unknown Error", () => {
    const res = makeRes();
    errorHandler(new Error("DB connection lost"), mockReq, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Something went wrong" });
  });

  it("logs the error to console.error for unknown errors", () => {
    const res = makeRes();
    const err = new Error("Unexpected failure");
    errorHandler(err, mockReq, res, next);

    expect(console.error).toHaveBeenCalledWith(err);
  });

  it("does not log AppErrors to console.error", () => {
    const res = makeRes();
    errorHandler(new AppError("Conflict", 409), mockReq, res, next);

    expect(console.error).not.toHaveBeenCalled();
  });
});
