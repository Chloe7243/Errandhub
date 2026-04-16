import Avatar from "@/components/avatar";
import BackButton from "@/components/ui/back-button";
import EmptyState from "@/components/empty-state";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  useGetErrandByIdQuery,
  useUpdateErrandStatusMutation,
} from "@/store/api/errand";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { displayErrorMessage } from "@/utils/errors";

const ReviewCompletion = () => {
  const { errandId } = useLocalSearchParams<{ errandId: string }>();
  const { currentData, isLoading } = useGetErrandByIdQuery(errandId!, {
    refetchOnMountOrArgChange: true,
  });
  const [updateStatus, { isLoading: isConfirming }] =
    useUpdateErrandStatusMutation();
  const errand = currentData?.errand;
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const router = useRouter();
  const REVIEW_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

  const getRemainingSeconds = () => {
    if (!errand?.updatedAt) return REVIEW_WINDOW_MS / 1000;
    const elapsed = Date.now() - new Date(errand.updatedAt).getTime();
    return Math.max(0, Math.ceil((REVIEW_WINDOW_MS - elapsed) / 1000));
  };

  const [autoConfirmCountdown, setAutoConfirmCountdown] = useState<number>(
    () => getRemainingSeconds(),
  );

  const handleAutoConfirm = useCallback(async () => {
    if (!errand) return;
    try {
      await updateStatus({
        errandId: errand.id,
        status: "COMPLETED",
      }).unwrap();
      Toast.show({
        type: "success",
        text1: "Auto-confirmed",
        text2: "Task marked as completed after 5 minutes.",
      });
    } catch (err) {
      displayErrorMessage(err);
    }
  }, [errand, updateStatus]);

  const handleManualConfirm = useCallback(async () => {
    if (!errand) return;
    try {
      await updateStatus({
        errandId: errand.id,
        status: "COMPLETED",
      }).unwrap();
      Toast.show({
        type: "success",
        text1: "Completion confirmed!",
        text2: "Payment will be released to the helper.",
      });
      router.push("/requester/home");
    } catch (err) {
      displayErrorMessage(err);
    }
  }, [errand, updateStatus, router]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Auto-confirm after 5 minutes if user hasn't manually confirmed.
  // Seed from errand.updatedAt so the countdown survives navigation.
  useEffect(() => {
    if (!errand || errand.status !== "REVIEWING") return;

    // Sync to real remaining time whenever errand data arrives
    const initial = getRemainingSeconds();
    setAutoConfirmCountdown(initial);

    if (initial <= 0) {
      handleAutoConfirm();
      return;
    }

    const timer = setInterval(() => {
      const remaining = getRemainingSeconds();
      setAutoConfirmCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        handleAutoConfirm();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [errand?.updatedAt, errand?.status, handleAutoConfirm]);

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <LoadingSpinner fullScreen />
      </SafeAreaView>
    );
  }

  if (!errand) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View
          style={[
            styles.header,
            {
              justifyContent: "flex-start",
              paddingHorizontal: 14,
              paddingVertical: 20,
            },
          ]}
        >
          <BackButton onBack={() => router.push("/requester/home")} />
        </View>
        <EmptyState
          containerStyle={{ marginHorizontal: 14 }}
          fullScreen
          isError
          message="Errand not found"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <BackButton onBack={() => router.push("/requester/home")} />
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>
            Review Completion
          </Text>
        </View>

        {/* Proof Image */}
        <View
          style={[
            styles.imageContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {errand.proofImageUrl ? (
            <Image
              source={{ uri: errand.proofImageUrl }}
              style={styles.proofImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons
                name="image-outline"
                size={32}
                color={colors.textTertiary}
              />
              <Text
                style={[
                  styles.imagePlaceholderText,
                  { color: colors.textTertiary },
                ]}
              >
                Delivery Proof
              </Text>
            </View>
          )}
          <View
            style={[styles.imageBadge, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.imageBadgeText, { color: colors.text }]}>
              Proof of Delivery
            </Text>
          </View>
        </View>

        {/* Helper Note */}
        {errand.helper && (
          <View
            style={[
              styles.noteCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Avatar
              firstName={errand.helper.firstName}
              lastName={errand.helper.lastName}
              uri={errand.helper.avatarUrl ?? undefined}
              size={44}
            />
            <View style={styles.noteContent}>
              <View
                style={[
                  styles.noteBubble,
                  { backgroundColor: colors.backgroundSecondary },
                ]}
              >
                <Text style={[styles.noteText, { color: colors.text }]}>
                  {errand.completionNote || "No note provided."}
                </Text>
              </View>
              <Text style={[styles.noteMeta, { color: colors.textTertiary }]}>
                {errand.helper.firstName} {errand.helper.lastName} •{" "}
                {errand.completedAt
                  ? new Date(errand.completedAt).toLocaleString()
                  : "Just now"}
              </Text>
            </View>
          </View>
        )}

        {/* Task Verification */}
        <View
          style={[
            styles.verificationCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.verificationTitle, { color: colors.text }]}>
            Task Completed
          </Text>
          <View style={styles.checkRow}>
            <Text style={[styles.checkText, { color: colors.textSecondary }]}>
              Task marked as reviewing
            </Text>
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={colors.success}
            />
          </View>
        </View>

        {/* Actions */}
        {errand.status === "REVIEWING" && (
          <>
            <View
              style={[
                styles.countdownCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons
                name="timer-outline"
                size={16}
                color={colors.textTertiary}
              />
              <Text
                style={[styles.countdownText, { color: colors.textTertiary }]}
              >
                Auto-confirms in {formatCountdown(autoConfirmCountdown)}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                { backgroundColor: colors.success },
              ]}
              onPress={handleManualConfirm}
              disabled={isConfirming}
            >
              {isConfirming ? (
                <Text style={styles.confirmText}>Confirming...</Text>
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.confirmText}>
                    Confirm & Release Payment
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.disputeButton}
              onPress={() =>
                router.push(`/requester/raise-dispute?id=${errand.id}`)
              }
            >
              <Ionicons
                name="warning-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={[styles.disputeText, { color: colors.error }]}>
                Raise Dispute
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReviewCompletion;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, gap: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  imageContainer: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    height: 220,
  },
  proofImage: { width: "100%", height: "100%" },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  imagePlaceholderText: { fontSize: 14 },
  imageBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  imageBadgeText: { fontSize: 12, fontWeight: "600" },
  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  noteContent: { flex: 1, gap: 6 },
  noteBubble: {
    padding: 12,
    borderRadius: 12,
  },
  noteText: { fontSize: 14, lineHeight: 20 },
  noteMeta: { fontSize: 12 },
  verificationCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  verificationTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  checkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  checkText: { fontSize: 14 },
  countdownCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  countdownText: { fontSize: 13, fontWeight: "500" },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  confirmText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  disputeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  disputeText: { fontSize: 14, fontWeight: "500" },
});
