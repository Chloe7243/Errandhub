import Toast from "react-native-toast-message";

const DEFAULT_MSG = "Something went wrong, please try again!";

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
