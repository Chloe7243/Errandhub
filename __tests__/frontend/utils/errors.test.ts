const mockShow = jest.fn();

jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: { show: (...args: any[]) => mockShow(...args) },
}));

jest.mock("expo-network", () => ({
  getNetworkStateAsync: jest.fn(),
}));

import { displayErrorMessage } from "../../../apps/frontend/utils/errors";
import * as Network from "expo-network";

const mockNetwork = Network.getNetworkStateAsync as jest.Mock;

const DEFAULT = "Something went wrong, please try again!";

beforeEach(() => {
  mockShow.mockClear();
  mockNetwork.mockClear();
});

describe("displayErrorMessage", () => {
  it("shows a single toast for a string message on err.data.message", async () => {
    await displayErrorMessage({ data: { message: "Not found" } });
    expect(mockShow).toHaveBeenCalledTimes(1);
    expect(mockShow).toHaveBeenCalledWith({
      type: "error",
      text1: "Not found",
    });
  });

  it("shows one toast per item when err.data.message is an array", async () => {
    await displayErrorMessage({
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

  it("falls back to err.message when data is absent", async () => {
    await displayErrorMessage({ message: "Network error" });
    expect(mockShow).toHaveBeenCalledWith({
      type: "error",
      text1: "Network error",
    });
  });

  it("shows the default message when the error is completely empty", async () => {
    await displayErrorMessage({});
    expect(mockShow).toHaveBeenCalledWith({
      type: "error",
      text1: DEFAULT,
    });
  });

  it("shows the default message when called with undefined", async () => {
    await displayErrorMessage(undefined);
    expect(mockShow).toHaveBeenCalledWith({
      type: "error",
      text1: DEFAULT,
    });
  });

  describe("FETCH_ERROR", () => {
    it("shows a no-connection message when the device has no internet", async () => {
      mockNetwork.mockResolvedValue({ isConnected: false, isInternetReachable: false });

      await displayErrorMessage({ status: "FETCH_ERROR", error: "TypeError: Network request failed" });

      expect(mockShow).toHaveBeenCalledTimes(1);
      expect(mockShow).toHaveBeenCalledWith({
        type: "error",
        text1: "No internet connection",
        text2: "Please check your connection and try again.",
      });
    });

    it("shows a server-unreachable message when the device is online but the server cannot be reached", async () => {
      mockNetwork.mockResolvedValue({ isConnected: true, isInternetReachable: true });

      await displayErrorMessage({ status: "FETCH_ERROR", error: "TypeError: Network request failed" });

      expect(mockShow).toHaveBeenCalledTimes(1);
      expect(mockShow).toHaveBeenCalledWith({
        type: "error",
        text1: "Could not reach the server, please try again later.",
      });
    });

    it("treats isInternetReachable: null as offline (indeterminate = treat as no connection)", async () => {
      // expo-network returns null for isInternetReachable when it can't determine reachability.
      mockNetwork.mockResolvedValue({ isConnected: true, isInternetReachable: null });

      await displayErrorMessage({ status: "FETCH_ERROR", error: "TypeError: Network request failed" });

      expect(mockShow).toHaveBeenCalledWith({
        type: "error",
        text1: "No internet connection",
        text2: "Please check your connection and try again.",
      });
    });
  });
});
