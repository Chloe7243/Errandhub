import Avatar from "@/components/avatar";
import LoadingSpinner from "@/components/ui/loading-spinner";
import AvailabilityToggle from "@/components/availability-toggle";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { RootState } from "@/store";
import {
  useGetHelpedErrandsQuery,
  useGetSettingsQuery,
} from "@/store/api/user";
import { formatErrandType } from "@/utils/errand";
import { useRouter } from "expo-router";
import { getSocket } from "@/utils/socket";
import { clearHelperRequest } from "@/store/slices";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { User } from "@/types";

type ErrandRequestPayload = {
  errandId: string;
  title: string;
  description: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupReference?: string | null;
  suggestedPrice: number;
  type: string;
  requester: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
  expiresAt: string;
};

const HelperHome = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const dispatch = useAppDispatch();
  const user = useAppSelector((state: RootState) => state.auth.user) as User;
  const helperRequest = useAppSelector(
    (state: RootState) => state.matching.helperRequest,
  ) as ErrandRequestPayload | null;

  const { currentData: activeData, isLoading } = useGetHelpedErrandsQuery(
    { status: ["ACCEPTED", "IN_PROGRESS", "REVIEWING"] },
    { refetchOnMountOrArgChange: true },
  );
  const { currentData: settingsData } = useGetSettingsQuery(null);

  const [isAvailable, setIsAvailable] = useState(false);
  const [counterAmount, setCounterAmount] = useState(0);
  const [isNegotiationOpen, setIsNegotiationOpen] = useState(false);

  useEffect(() => {
    if (settingsData?.settings) {
      setIsAvailable(settingsData.settings.isAvailable);
    }
  }, [settingsData]);

  useEffect(() => {
    if (helperRequest) {
      setCounterAmount(helperRequest?.suggestedPrice);
    }
  }, [helperRequest]);

  const activeTask = activeData?.errands?.[0] ?? null;
  const hasActiveTask = !!activeTask;
  const countdownSeconds = helperRequest
    ? Math.max(
        0,
        Math.ceil(
          (new Date(helperRequest?.expiresAt).getTime() - Date.now()) / 1000,
        ),
      )
    : 0;

  const handleAccept = () => {
    const socket = getSocket();
    if (!helperRequest || !socket) return;
    socket.emit("accept_errand", { errandId: helperRequest?.errandId });
    dispatch(clearHelperRequest());
  };

  const handleDecline = () => {
    const socket = getSocket();
    if (!helperRequest || !socket) return;
    socket.emit("decline_errand", { errandId: helperRequest?.errandId });
    dispatch(clearHelperRequest());
  };

  const handleNegotiate = () => {
    setIsNegotiationOpen(true);
  };

  const handleSubmitCounterOffer = () => {
    const socket = getSocket();
    if (!helperRequest || !socket) return;
    socket.emit("counter_offer", {
      errandId: helperRequest?.errandId,
      amount: counterAmount,
    });
    dispatch(clearHelperRequest());
    setIsNegotiationOpen(false);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.userInfo}>
            <Avatar
              firstName={user?.firstName ?? ""}
              lastName={user?.lastName ?? ""}
              size={50}
            />
            <View>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                Good morning,
              </Text>
              <Text style={[styles.name, { color: colors.text }]}>
                {user?.firstName}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <AvailabilityToggle onValueChange={setIsAvailable} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Earnings
          </Text>
          <View style={styles.cardsRow}>
            {[
              { label: "Today", value: "—", icon: "trending-up-outline" },
              { label: "This Week", value: "—", icon: "wallet-outline" },
              {
                label: "Completed",
                value: "—",
                icon: "checkmark-circle-outline",
              },
            ].map((stat) => (
              <View
                key={stat.label}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={stat.icon as any}
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.cardValue, { color: colors.text }]}>
                  {stat.value}
                </Text>
                <Text
                  style={[styles.cardLabel, { color: colors.textSecondary }]}
                >
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Active Task
          </Text>
          {isLoading ? (
            <LoadingSpinner fullScreen customSize={1.5} />
          ) : !activeTask ? (
            <View
              style={[
                styles.emptyTask,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="bicycle-outline"
                size={28}
                color={colors.textTertiary}
              />
              <Text
                style={[styles.emptyTaskText, { color: colors.textTertiary }]}
              >
                No active task right now
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.activeTaskCard,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() =>
                router.push(`/helper/task-details?id=${activeTask.id}`)
              }
            >
              <View style={styles.activeTaskHeader}>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: colors.primary + "20" },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: colors.primary }]}>
                    {formatErrandType(activeTask.type)}
                  </Text>
                </View>
                <Text
                  style={[styles.activeTaskPrice, { color: colors.primary }]}
                >
                  £
                  {(
                    activeTask.agreedPrice ?? activeTask.suggestedPrice
                  )?.toFixed(2) ?? "—"}
                </Text>
              </View>
              <Text style={[styles.activeTaskTitle, { color: colors.text }]}>
                {activeTask.title}
              </Text>
              <View style={styles.locationRow}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text
                  style={[styles.locationText, { color: colors.textSecondary }]}
                >
                  {activeTask.pickupLocation}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() =>
                  router.push(`/helper/task-details?id=${activeTask.id}`)
                }
              >
                <Ionicons name="navigate-outline" size={16} color="#fff" />
                <Text style={styles.continueButtonText}>Continue Task</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Dispatch
          </Text>
          {!isAvailable ? (
            <View
              style={[
                styles.unavailableBanner,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="radio-outline"
                size={20}
                color={colors.textTertiary}
              />
              <Text
                style={[
                  styles.unavailableText,
                  { color: colors.textSecondary },
                ]}
              >
                Toggle availability on to receive urgent errand requests.
              </Text>
            </View>
          ) : hasActiveTask ? (
            <View
              style={[
                styles.unavailableBanner,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="briefcase-outline"
                size={20}
                color={colors.textTertiary}
              />
              <Text
                style={[
                  styles.unavailableText,
                  { color: colors.textSecondary },
                ]}
              >
                Complete your current task to receive a new dispatch.
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.emptyTask,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="hourglass-outline"
                size={28}
                color={colors.textTertiary}
              />
              <Text
                style={[styles.emptyTaskText, { color: colors.textSecondary }]}
              >
                Waiting for a new errand to be dispatched to you.
              </Text>
              <Text
                style={[styles.emptyTaskLabel, { color: colors.textTertiary }]}
              >
                Stay available and online to receive the next request.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {helperRequest ? (
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
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
              From {helperRequest?.requester?.firstName || ""}{" "}
              {helperRequest?.requester?.lastName || ""}
            </Text>
            <Text style={[styles.modalText, { color: colors.text }]}>
              {helperRequest.title}
            </Text>
            <Text style={[styles.modalInfo, { color: colors.textSecondary }]}>
              Pickup: {helperRequest.pickupLocation}
            </Text>
            <Text style={[styles.modalInfo, { color: colors.textSecondary }]}>
              Drop-off: {helperRequest.dropoffLocation}
            </Text>
            <Text style={[styles.modalInfo, { color: colors.textSecondary }]}>
              Suggested: £{helperRequest?.suggestedPrice?.toFixed(2)}
            </Text>
            <Text style={[styles.countdown, { color: colors.primary }]}>
              Respond in {countdownSeconds}s
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleAccept}
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
                onPress={handleNegotiate}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Negotiate
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#EF4444" }]}
                onPress={handleDecline}
              >
                <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                  Decline
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}

      {isNegotiationOpen ? (
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
            <Text style={[styles.modalInfo, { color: colors.textSecondary }]}>
              Adjust the price in £0.50 increments.
            </Text>
            <View style={styles.counterRow}>
              <TouchableOpacity
                style={[
                  styles.counterButton,
                  { backgroundColor: colors.background },
                ]}
                onPress={() =>
                  setCounterAmount((prev) =>
                    Math.max(helperRequest?.suggestedPrice ?? 0, prev - 0.5),
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
                onPress={() =>
                  setCounterAmount((prev) =>
                    Math.min(
                      (helperRequest?.suggestedPrice ?? 0) * 2,
                      prev + 0.5,
                    ),
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
                onPress={handleSubmitCounterOffer}
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
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

export default HelperHome;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 16,
  },
  userInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  greeting: { fontSize: 14 },
  name: { fontSize: 18, fontWeight: "600" },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
    paddingBottom: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600" },
  cardsRow: { flexDirection: "row", gap: 10 },
  card: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, gap: 6 },
  cardValue: { fontSize: 18, fontWeight: "700" },
  cardLabel: { fontSize: 11 },
  emptyTask: {
    padding: 24,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  emptyTaskText: { fontSize: 13, textAlign: "center" },
  emptyTaskLabel: { fontSize: 12, textAlign: "center" },
  activeTaskCard: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 8,
  },
  activeTaskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  activeTaskPrice: { fontSize: 16, fontWeight: "700" },
  activeTaskTitle: { fontSize: 15, fontWeight: "600" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontSize: 13 },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  continueButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  unavailableBanner: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  unavailableText: { fontSize: 13, textAlign: "center", lineHeight: 20 },
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
  countdown: { fontSize: 14, fontWeight: "700" },
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
