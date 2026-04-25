import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ErrandRequestPayload } from "@/store/slices/matching";
import { formatTimeRemaining } from "@/utils/time";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  helperRequest: ErrandRequestPayload | null;
  onAccept: () => void;
  onDecline: () => void;
  onCounterOffer: (amount: number) => void;
  onFavour: () => void;
};

/**
 * Helper-side dispatch modal for an incoming errand request.
 *
 * Two views sharing one countdown: the initial accept/negotiate/decline
 * screen, and the negotiation screen with a +/- counter-offer stepper
 * (£0.50 increments, bounded between suggestedPrice and 2x suggestedPrice
 * to match the backend's validation). When the countdown hits zero the
 * component auto-fires onDecline so the backend can roll on to the next
 * candidate without waiting on the user.
 */
const DispatchRequestModal = ({
  helperRequest,
  onAccept,
  onDecline,
  onCounterOffer,
  onFavour,
}: Props) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];

  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [counterAmount, setCounterAmount] = useState(0);
  const [isNegotiationOpen, setIsNegotiationOpen] = useState(false);

  const countdownAnim = useRef(new Animated.Value(1)).current;

  // Reset counter amount and negotiation state when a new request arrives
  useEffect(() => {
    if (!helperRequest) return;
    setCounterAmount(helperRequest.suggestedPrice);
    setIsNegotiationOpen(false);
  }, [helperRequest]);

  useEffect(() => {
    if (!helperRequest) return;

    const getRemaining = () =>
      Math.max(
        0,
        Math.ceil(
          (new Date(helperRequest.expiresAt).getTime() - Date.now()) / 1000,
        ),
      );

    setCountdownSeconds(getRemaining());

    const interval = setInterval(() => {
      const remaining = getRemaining();
      setCountdownSeconds(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onDecline();
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [helperRequest]);

  useEffect(() => {
    if (!helperRequest) return;
    const remaining = new Date(helperRequest.expiresAt).getTime() - Date.now();
    countdownAnim.setValue(1);
    const anim = Animated.timing(countdownAnim, {
      toValue: 0,
      duration: Math.max(0, remaining),
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [helperRequest]);

  if (!helperRequest) return null;

  return (
    <>
      {/* Dispatch request */}
      {!isNegotiationOpen && (
        <View
          style={[styles.overlay, { backgroundColor: colors.surface + "CC" }]}
        >
          <View
            style={[
              styles.modal,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              New Dispatch Request
            </Text>

            {/* Countdown bar + label */}
            <View style={styles.countdownContainer}>
              <View
                style={[
                  styles.countdownTrack,
                  { backgroundColor: colors.border },
                ]}
              >
                <Animated.View
                  style={[
                    styles.countdownFill,
                    {
                      backgroundColor: colors.primary,
                      width: countdownAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", "100%"],
                      }),
                    },
                  ]}
                />
              </View>
              <Text
                style={[styles.countdownLabel, { color: colors.textSecondary }]}
              >
                {formatTimeRemaining(countdownSeconds)} remaining
              </Text>
            </View>

            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
              From {helperRequest.requester?.firstName ?? ""}{" "}
              {helperRequest.requester?.lastName ?? ""}
            </Text>
            <Text style={[styles.modalText, { color: colors.text }]}>
              {helperRequest.title}
            </Text>
            {helperRequest.type === "HANDS_ON_HELP" ? (
              <Text style={[styles.modalInfo, { color: colors.textSecondary }]}>
                Location: {helperRequest.firstLocation}
              </Text>
            ) : (
              <>
                <Text
                  style={[styles.modalInfo, { color: colors.textSecondary }]}
                >
                  Pickup: {helperRequest.firstLocation}
                </Text>
                <Text
                  style={[styles.modalInfo, { color: colors.textSecondary }]}
                >
                  Drop-off: {helperRequest.finalLocation}
                </Text>
              </>
            )}
            <Text style={[styles.modalInfo, { color: colors.textSecondary }]}>
              Suggested: £{helperRequest.suggestedPrice?.toFixed(2)}
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={onAccept}
              >
                <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                  Accept
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.surface },
                ]}
                onPress={() => setIsNegotiationOpen(true)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Negotiate
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.success + "CC" },
                ]}
                onPress={onFavour}
              >
                <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                  Do as Favour 🤝
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#EF4444" }]}
                onPress={onDecline}
              >
                <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                  Decline
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Negotiation / counter offer */}
      {isNegotiationOpen && (
        <View
          style={[styles.overlay, { backgroundColor: colors.surface + "CC" }]}
        >
          <View
            style={[
              styles.modal,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Counter Offer
            </Text>

            {/* Countdown bar stays visible in negotiation too */}
            <View style={styles.countdownContainer}>
              <View
                style={[
                  styles.countdownTrack,
                  { backgroundColor: colors.border },
                ]}
              >
                <Animated.View
                  style={[
                    styles.countdownFill,
                    {
                      backgroundColor: colors.primary,
                      width: countdownAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", "100%"],
                      }),
                    },
                  ]}
                />
              </View>
              <Text
                style={[styles.countdownLabel, { color: colors.textSecondary }]}
              >
                {formatTimeRemaining(countdownSeconds)} remaining
              </Text>
            </View>

            <Text style={[styles.modalInfo, { color: colors.textSecondary }]}>
              Adjust the price in £0.50 increments.
            </Text>
            <View style={styles.counterRow}>
              <TouchableOpacity
                style={[
                  styles.counterButton,
                  { backgroundColor: colors.background },
                ]}
                // Floor at the original suggested price — a helper can
                // propose more but not less than the requester offered.
                onPress={() =>
                  setCounterAmount((prev) =>
                    Math.max(helperRequest.suggestedPrice, prev - 0.5),
                  )
                }
              >
                <Text
                  style={[styles.counterButtonText, { color: colors.text }]}
                >
                  -
                </Text>
              </TouchableOpacity>
              <Text style={[styles.counterAmount, { color: colors.text }]}>
                £{counterAmount.toFixed(2)}
              </Text>
              <TouchableOpacity
                style={[
                  styles.counterButton,
                  { backgroundColor: colors.background },
                ]}
                // Cap at 2x the suggested price to keep counter offers
                // reasonable and discourage silly lowball/highball games.
                onPress={() =>
                  setCounterAmount((prev) =>
                    Math.min(helperRequest.suggestedPrice * 2, prev + 0.5),
                  )
                }
              >
                <Text
                  style={[styles.counterButtonText, { color: colors.text }]}
                >
                  +
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => onCounterOffer(counterAmount)}
              >
                <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                  Send Offer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.surface },
                ]}
                onPress={() => setIsNegotiationOpen(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Back
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </>
  );
};

export default DispatchRequestModal;

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modal: {
    width: "100%",
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalLabel: { fontSize: 13 },
  modalText: { fontSize: 15, fontWeight: "600" },
  modalInfo: { fontSize: 13 },
  countdownContainer: { gap: 6 },
  countdownTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  countdownFill: {
    height: "100%",
    borderRadius: 2,
  },
  countdownLabel: { fontSize: 12 },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalButtonText: { fontWeight: "700" },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  counterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  counterButtonText: { fontSize: 20, fontWeight: "700" },
  counterAmount: { fontSize: 18, fontWeight: "700" },
});
