import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { connectSocket, disconnectSocket } from "@/utils/socket";
import { api } from "@/store/api";
import { TAGS } from "@/utils/constants";
import {
  setHelperRequest,
  setReviewWindow,
  setCounterOffer,
  setErrandExpired,
  setErrandAssigned,
  AuthState,
} from "@/store/slices";
import { addMessage } from "@/store/slices/chat";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import Toast from "react-native-toast-message";

export default function ProtectedLayout() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth) as AuthState;

  useEffect(() => {
    let mounted = true;
    const setupSocket = async () => {
      try {
        const socket = await connectSocket();
        if (!mounted) return;

        console.log("Errand Flow");

        socket.on("errand_request", (payload) => {
          console.log("Errand Request", { payload });
          dispatch(setHelperRequest(payload));
        });

        socket.on("receive_message", (message) => {
          dispatch(addMessage({ errandId: message.errandId, message }));
        });

        socket.on("review_window", (payload) => {
          console.log("Review Window", { payload });
          dispatch(setReviewWindow(payload));
          dispatch(api.util.invalidateTags([TAGS.REQUESTED_ERRANDS]));
          if (user?.role === "requester") {
            router.push(`/requester/errand-details?id=${payload.errandId}`);
          }
        });

        socket.on("counter_offer", (payload) => {
          console.log("Counter Offer", { payload });
          dispatch(setCounterOffer(payload));
          if (user?.role === "requester") {
            router.push(`/requester/errand-details?id=${payload.errandId}`);
          }
        });

        socket.on("errand_expired", (payload) => {
          console.log("Errand Expired", { payload });
          dispatch(setErrandExpired(payload));
          dispatch(api.util.invalidateTags([TAGS.REQUESTED_ERRANDS]));
          Toast.show({
            type: "error",
            text1: "No helpers available",
            text2: "We could not find a helper for your errand.",
          });
        });

        socket.on("errand_assigned", (payload) => {
          console.log("Errand Assigned", { payload });
          dispatch(setErrandAssigned(payload));
          dispatch(api.util.invalidateTags([TAGS.REQUESTED_ERRANDS, TAGS.HELPED_ERRANDS]));
          if (user?.role === "helper") {
            router.push(`/helper/task-details?id=${payload.errandId}`);
          }
        });

        socket.on("match_unavailable", (payload) => {
          console.log("Match unavaialble", { payload });
          if (user?.role === "helper") {
            Toast.show({
              type: "info",
              text1: "Match unavailable",
              text2: payload.message,
            });
          }
        });
      } catch (error) {
        console.error("Socket listener setup failed", error);
      }
    };

    setupSocket();

    return () => {
      mounted = false;
      disconnectSocket();
    };
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
