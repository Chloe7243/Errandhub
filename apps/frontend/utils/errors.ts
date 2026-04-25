import Toast from "react-native-toast-message";
import * as Network from "expo-network";

const DEFAULT_MSG = "Something went wrong, please try again!";

/**
 * Surface an RTK Query / API error as one or more toast messages.
 *
 * RTK Query errors expose err.data.message from our AppError JSON envelope.
 * That message can be either a single string or an array (e.g. several Zod
 * issues on the same request); this helper handles both so a validation
 * error isn't collapsed into one opaque toast. Falls back to a generic
 * default when nothing useful is present.
 */
export const displayErrorMessage = async (err: any) => {
  // FETCH_ERROR covers no connection, server down, DNS failure, and timeouts.
  // Check actual device connectivity before deciding which message to show.

  if (err?.status === "FETCH_ERROR") {
    const state = await Network.getNetworkStateAsync();
    if (!state.isConnected || !state.isInternetReachable) {
      Toast.show({
        type: "error",
        text1: "No internet connection",
        text2: "Please check your connection and try again.",
      });
    } else {
      // Device is online but the server couldn't be reached — likely down or unreachable.
      Toast.show({
        type: "error",
        text1: "Could not reach the server, please try again later.",
      });
    }
    return;
  }

  if (Array.isArray(err?.data?.message)) {
    err.data.message.forEach((msg: string) =>
      Toast.show({
        type: "error",
        text1: msg || DEFAULT_MSG,
      }),
    );
  } else {
    Toast.show({
      type: "error",
      text1: err?.data?.message || err?.message || DEFAULT_MSG,
    });
  }
};
