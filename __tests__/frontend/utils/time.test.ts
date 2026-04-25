import { formatTimeRemaining } from "../../../apps/frontend/utils/time";

describe("formatTimeRemaining", () => {
  it("returns '0s' for zero seconds", () => {
    expect(formatTimeRemaining(0)).toBe("0s");
  });

  it("returns '0s' for negative values", () => {
    expect(formatTimeRemaining(-10)).toBe("0s");
  });

  it("formats seconds below a minute", () => {
    expect(formatTimeRemaining(45)).toBe("45s");
  });

  it("formats exactly one minute", () => {
    expect(formatTimeRemaining(60)).toBe("1m");
  });

  it("formats minutes and seconds", () => {
    expect(formatTimeRemaining(90)).toBe("1m 30s");
  });

  it("formats minutes with no remainder seconds", () => {
    expect(formatTimeRemaining(120)).toBe("2m");
  });

  it("formats exactly one hour", () => {
    expect(formatTimeRemaining(3600)).toBe("1h");
  });

  it("formats hours and minutes", () => {
    expect(formatTimeRemaining(3660)).toBe("1h 1m");
  });

  it("omits seconds when hours are present", () => {
    // 3661 = 1h 1m 1s — seconds are not shown at the hour scale
    expect(formatTimeRemaining(3661)).toBe("1h 1m");
  });

  it("formats hours with no remainder minutes", () => {
    expect(formatTimeRemaining(7200)).toBe("2h");
  });
});
