import Toast from "react-native-toast-message";

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
export const displayErrorMessage = (err: any) => {
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
