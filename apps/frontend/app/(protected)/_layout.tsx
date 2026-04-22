/* eslint-disable react-hooks/exhaustive-deps */
import { api } from "@/store/api";
import { useSavePushTokenMutation } from "@/store/api/user";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  AuthState,
  clearCounterOffer,
  clearHelperRequest,
  setCounterOffer,
  setErrandAssigned,
  setErrandExpired,
  setHelperRequest,
} from "@/store/slices";
import { addMessage } from "@/store/slices/chat";
import { TAGS } from "@/utils/constants";
import { connectSocket, disconnectSocket, getSocket } from "@/utils/socket";
import { registerForPushNotifications } from "@/utils/notifications";
import CounterOfferModal from "@/components/counter-offer-modal";
import DispatchRequestModal from "@/components/dispatch-request-modal";
import type { RootState } from "@/store";
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import Toast from "react-native-toast-message";

// Top-level layout for every authenticated screen. This component is the
// single place we wire up:
//   - Expo push notifications (register + in-app deep-link on tap)
//   - the global socket.io connection and every cross-cutting event
//     (matching, chat, lifecycle transitions, disputes)
//   - the two modals (dispatch request / counter offer) that can appear
//     over any screen when the matching service targets this user
// Doing it here means individual screens don't have to subscribe — they
// just read the resulting redux state or navigate via router.push.
export default function ProtectedLayout() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth) as AuthState;
  const [savePushToken] = useSavePushTokenMutation();

  const helperRequest = useAppSelector(
    (state: RootState) => state.matching.helperRequest,
  );
  const counterOffer = useAppSelector(
    (state: RootState) => state.matching.counterOffer,
  );

  // Helper: dispatch request modal handlers
  const handleAccept = () => {
    const socket = getSocket();
    if (!helperRequest || !socket) return;
    socket.emit("accept_errand", { errandId: helperRequest.errandId });
    dispatch(clearHelperRequest());
  };

  const handleDecline = () => {
    const socket = getSocket();
    if (!helperRequest || !socket) return;
    socket.emit("decline_errand", { errandId: helperRequest.errandId });
    dispatch(clearHelperRequest());
  };

  const handleCounterOffer = (amount: number) => {
    const socket = getSocket();
    if (!helperRequest || !socket) return;
    socket.emit("counter_offer", { errandId: helperRequest.errandId, amount });
    dispatch(clearHelperRequest());
  };

  // Requester: counter offer modal handlers
  const handleCounterOfferAccept = () => {
    const socket = getSocket();
    if (!socket || !counterOffer) return;
    socket.emit("offer_response", { errandId: counterOffer.errandId, accept: true });
    dispatch(clearCounterOffer());
  };

  const handleCounterOfferDecline = () => {
    const socket = getSocket();
    if (!socket || !counterOffer) return;
    socket.emit("offer_response", { errandId: counterOffer.errandId, accept: false });
    dispatch(clearCounterOffer());
  };

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

        socket.on("work_started", (payload) => {
          dispatch(
            api.util.invalidateTags([{ type: TAGS.ERRAND, id: payload.errandId }]),
          );
          if (user?.role === "requester") {
            Toast.show({
              type: "info",
              text1: "Work has started",
              text2: "Your helper has arrived and the timer is running.",
            });
          }
        });

        socket.on("errand_extended", (payload) => {
          dispatch(
            api.util.invalidateTags([{ type: TAGS.ERRAND, id: payload.errandId }]),
          );
          if (user?.role === "requester") {
            Toast.show({
              type: "info",
              text1: "Job extended",
              text2: `Your helper needs ${payload.additionalHours} more hour${payload.additionalHours !== 1 ? "s" : ""}.`,
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

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      <DispatchRequestModal
        helperRequest={helperRequest}
        onAccept={handleAccept}
        onDecline={handleDecline}
        onCounterOffer={handleCounterOffer}
      />
      <CounterOfferModal
        counterOffer={counterOffer}
        onAccept={handleCounterOfferAccept}
        onDecline={handleCounterOfferDecline}
      />
    </View>
  );
}
