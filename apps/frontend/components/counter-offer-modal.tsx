import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { CounterOfferPayload } from "@/store/slices/matching";
import { formatTimeRemaining } from "@/utils/time";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Avatar from "./avatar";

type Props = {
  counterOffer: CounterOfferPayload | null;
  onAccept: () => void;
  onDecline: () => void;
};

/**
 * Requester-side modal shown when a helper proposes an alternative price.
 *
 * The countdown is driven by the server-provided `expiresAt`: two parallel
 * effects keep the text label in sync (per-second setState) and the
 * progress bar in sync (single Animated timing). onAccept/onDecline are
 * wired to the socket actions on the parent screen so the server can
 * confirm the assignment or roll on to the next candidate.
 */
const CounterOfferModal = ({ counterOffer, onAccept, onDecline }: Props) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];

  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const countdownAnim = useRef(new Animated.Value(1)).current;

  // Countdown text — ticks every second
  useEffect(() => {
    if (!counterOffer) return;

    const getRemaining = () =>
      Math.max(
        0,
        Math.ceil(
          (new Date(counterOffer.expiresAt).getTime() - Date.now()) / 1000,
        ),
      );

    setCountdownSeconds(getRemaining());

    const interval = setInterval(() => {
      const remaining = getRemaining();
      setCountdownSeconds(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [counterOffer]);

  // Animated shrinking bar
  useEffect(() => {
    if (!counterOffer) return;
    const remaining = new Date(counterOffer.expiresAt).getTime() - Date.now();
    countdownAnim.setValue(1);
    const anim = Animated.timing(countdownAnim, {
      toValue: 0,
      duration: Math.max(0, remaining),
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [counterOffer]);

  if (!counterOffer) return null;

  return (
    <View style={[styles.overlay, { backgroundColor: colors.surface + "CC" }]}>
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

        {/* Countdown bar */}
        <View style={styles.countdownContainer}>
          <View
            style={[styles.countdownTrack, { backgroundColor: colors.border }]}
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
            {formatTimeRemaining(countdownSeconds)} to respond
          </Text>
        </View>

        {/* Helper info */}
        <View style={styles.helperRow}>
          <Avatar
            firstName={counterOffer.helper.firstName}
            lastName={counterOffer.helper.lastName}
            uri={counterOffer.helper.avatarUrl ?? undefined}
            size={44}
          />
          <View style={styles.helperInfo}>
            <Text style={[styles.helperName, { color: colors.text }]}>
              {counterOffer.helper.firstName} {counterOffer.helper.lastName}
            </Text>
            {counterOffer.helper.completedCount !== undefined && (
              <Text
                style={[styles.helperSub, { color: colors.textSecondary }]}
              >
                {counterOffer.helper.completedCount} errands completed
              </Text>
            )}
          </View>
        </View>

        {/* Proposed amount */}
        <View
          style={[
            styles.amountBox,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
            Proposed price
          </Text>
          <Text style={[styles.amount, { color: colors.primary }]}>
            £{counterOffer.amount.toFixed(2)}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={onAccept}
          >
            <Text style={[styles.buttonText, { color: "#fff" }]}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#EF4444" }]}
            onPress={onDecline}
          >
            <Text style={[styles.buttonText, { color: "#fff" }]}>Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default CounterOfferModal;

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
  countdownContainer: { gap: 6 },
  countdownTrack: { height: 4, borderRadius: 2, overflow: "hidden" },
  countdownFill: { height: "100%", borderRadius: 2 },
  countdownLabel: { fontSize: 12 },
  helperRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  helperInfo: { flex: 1, gap: 2 },
  helperName: { fontSize: 15, fontWeight: "600" },
  helperSub: { fontSize: 12 },
  amountBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  amountLabel: { fontSize: 12 },
  amount: { fontSize: 28, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 10 },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: { fontWeight: "700", fontSize: 15 },
});
