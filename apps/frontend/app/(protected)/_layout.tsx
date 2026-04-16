/* eslint-disable react-hooks/exhaustive-deps */
import { api } from "@/store/api";
import { useSavePushTokenMutation } from "@/store/api/user";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  AuthState,
  setCounterOffer,
  setErrandAssigned,
  setErrandExpired,
  setHelperRequest,
} from "@/store/slices";
import { addMessage } from "@/store/slices/chat";
import { TAGS } from "@/utils/constants";
import { connectSocket, disconnectSocket } from "@/utils/socket";
import { registerForPushNotifications } from "@/utils/notifications";
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import Toast from "react-native-toast-message";

export default function ProtectedLayout() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth) as AuthState;
  const [savePushToken] = useSavePushTokenMutation();

  useEffect(() => {
    if (!user?.role) return;
    registerForPushNotifications().then((token) => {
      if (token) savePushToken(token);
    });
  }, [user?.role]);

  // Navigate to relevant screen when user taps a push notification
  useEffect(() => {
    if (!user?.role) return;
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as
          | { type?: string; errandId?: string }
          | undefined;
        const { errandId, type } = data ?? {};
        if (!errandId) return;

        if (type === "message") {
          if (user.role === "requester") {
            router.push(`/requester/chat?errandId=${errandId}`);
          } else if (user.role === "helper") {
            router.push(`/helper/chat?errandId=${errandId}`);
          }
        } else {
          if (user.role === "requester") {
            router.push(`/requester/errand-details?id=${errandId}`);
          } else if (user.role === "helper") {
            router.push(`/helper/task-details?id=${errandId}`);
          }
        }
      },
    );
    return () => sub.remove();
  }, [user?.role]);

  useEffect(() => {
    let mounted = true;
    const setupSocket = async () => {
      try {
        const socket = await connectSocket();
        if (!mounted) return;

        socket.on("errand_request", (payload) => {
          dispatch(setHelperRequest(payload));
        });

        socket.on("receive_message", (message) => {
          dispatch(addMessage({ errandId: message.errandId, message }));
        });

        socket.on("counter_offer", (payload) => {
          dispatch(setCounterOffer(payload));
          if (user?.role === "requester") {
            router.push(`/requester/errand-details?id=${payload.errandId}`);
          }
        });

        socket.on("errand_expired", (payload) => {
          dispatch(setErrandExpired(payload));
          dispatch(api.util.invalidateTags([TAGS.REQUESTED_ERRANDS]));
          Toast.show({
            type: "error",
            text1: "No helpers available",
            text2: "We could not find a helper for your errand.",
          });
        });

        socket.on("errand_assigned", (payload) => {
          dispatch(setErrandAssigned(payload));
          dispatch(
            api.util.invalidateTags([
              TAGS.REQUESTED_ERRANDS,
              TAGS.HELPED_ERRANDS,
              { type: TAGS.ERRAND, id: payload.errandId },
            ]),
          );
          if (user?.role === "helper") {
            router.push(`/helper/task-details?id=${payload.errandId}`);
          }
        });

        socket.on("proof_submitted", (payload) => {
          dispatch(
            api.util.invalidateTags([
              { type: TAGS.ERRAND, id: payload.errandId },
              TAGS.REQUESTED_ERRANDS,
            ]),
          );
          if (user?.role === "requester") {
            router.push(
              `/requester/review-completion?errandId=${payload.errandId}`,
            );
          }
        });

        socket.on("errand_completed", (payload) => {
          dispatch(
            api.util.invalidateTags([
              TAGS.HELPED_ERRANDS,
              { type: TAGS.ERRAND, id: payload.errandId },
            ]),
          );
          if (user?.role === "helper") {
            router.push(`/helper/home`);
          }
        });

        socket.on("errand_disputed", (payload) => {
          dispatch(
            api.util.invalidateTags([
              TAGS.HELPED_ERRANDS,
              { type: TAGS.ERRAND, id: payload.errandId },
            ]),
          );
          if (user?.role === "helper") {
            Toast.show({
              type: "error",
              text1: "Dispute raised",
              text2: "The requester has raised a dispute on your errand.",
            });
          }
        });

        socket.on("offer_rejected", (payload) => {
          if (user?.role === "helper") {
            dispatch(
              api.util.invalidateTags([
                { type: TAGS.ERRAND, id: payload.errandId },
                TAGS.HELPED_ERRANDS,
              ]),
            );
            Toast.show({
              type: "error",
              text1: "Offer declined",
              text2: "The requester didn't accept your counter offer.",
            });
          }
        });

        socket.on("match_unavailable", (payload) => {
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
    // Re-run when role changes so the socket reconnects with the role-bearing token
  }, [user?.role]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
