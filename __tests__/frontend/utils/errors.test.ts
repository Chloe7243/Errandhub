const mockShow = jest.fn();

jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: { show: (...args: any[]) => mockShow(...args) },
}));

import { displayErrorMessage } from "../../../apps/frontend/utils/errors";

const DEFAULT = "Something went wrong, please try again!";

beforeEach(() => {
  mockShow.mockClear();
});

describe("displayErrorMessage", () => {
  it("shows a single toast for a string message on err.data.message", () => {
    displayErrorMessage({ data: { message: "Not found" } });
    expect(mockShow).toHaveBeenCalledTimes(1);
    expect(mockShow).toHaveBeenCalledWith({
      type: "error",
      text1: "Not found",
    });
  });

  it("shows one toast per item when err.data.message is an array", () => {
    displayErrorMessage({
      data: { message: ["Email is required", "Password is too short"] },
    });
    expect(mockShow).toHaveBeenCalledTimes(2);
    expect(mockShow).toHaveBeenNthCalledWith(1, {
      type: "error",
      text1: "Email is required",
    });
    expect(mockShow).toHaveBeenNthCalledWith(2, {
      type: "error",
      text1: "Password is too short",
    });
  });

  it("falls back to err.message when data is absent", () => {
    displayErrorMessage({ message: "Network error" });
    expect(mockShow).toHaveBeenCalledWith({
      type: "error",
      text1: "Network error",
    });
  });

  it("shows the default message when the error is completely empty", () => {
    displayErrorMessage({});
    expect(mockShow).toHaveBeenCalledWith({
      type: "error",
      text1: DEFAULT,
    });
  });

  it("shows the default message when called with undefined", () => {
    displayErrorMessage(undefined);
    expect(mockShow).toHaveBeenCalledWith({
      type: "error",
      text1: DEFAULT,
    });
  });

  it("shows a network-specific message for a FETCH_ERROR (device offline)", () => {
    displayErrorMessage({ status: "FETCH_ERROR", error: "TypeError: Network request failed" });
    expect(mockShow).toHaveBeenCalledTimes(1);
    expect(mockShow).toHaveBeenCalledWith({
      type: "error",
      text1: "No internet connection, please check your connection and try again.",
    });
  });
});
