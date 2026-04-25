import Avatar from "@/components/avatar";
import EmptyState from "@/components/empty-state";
import ErrandStepper from "@/components/errand-stepper";
import BackButton from "@/components/ui/back-button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { RootState } from "@/store";
import { useGetErrandByIdQuery } from "@/store/api/errand";
import { useAppSelector } from "@/store/hooks";
import { parseChecklist } from "@/store/slices/checklist";
import { formatErrandType } from "@/utils/errand";
import { displayErrorMessage } from "@/utils/errors";
import { formatTimeRemaining } from "@/utils/time";
import { CreateErrandInput } from "@errandhub/shared";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const ErrandDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentData, isLoading, refetch } = useGetErrandByIdQuery(id!, {
    refetchOnMountOrArgChange: true,
  });

  const router = useRouter();
  const colorScheme = useColorScheme();
  const errand = currentData?.errand;
  const colors = Colors[colorScheme ?? "dark"];
  const expiredErrandId = useAppSelector(
    (state: RootState) => state.matching.expiredErrandId,
  );

  useEffect(() => {
    if (expiredErrandId === id) refetch();
  }, [expiredErrandId, id, refetch]);

  const isActive = errand?.status === "IN_PROGRESS";
  const isCompleted = errand?.status === "COMPLETED";
  const isReviewing = errand?.status === "REVIEWING";
  const isExpired = errand?.status === "EXPIRED";
  const isTerminal =
    errand?.status === "CANCELLED" || errand?.status === "DISPUTED";
  const displayAmount = errand?.agreedPrice ?? errand?.suggestedPrice;

  // Seconds until the 1-minute repost cooldown expires
  const getRepostSecondsLeft = useCallback(
    () =>
      errand?.updatedAt
        ? Math.max(
            0,
            Math.ceil(
              (new Date(errand.updatedAt).getTime() + 60 * 1000 - Date.now()) /
                1000,
            ),
          )
        : 0,
    [errand?.updatedAt],
  );

  const [repostSecondsLeft, setRepostSecondsLeft] = useState(() =>
    getRepostSecondsLeft(),
  );

  useEffect(() => {
    if (!isExpired) return;
    setRepostSecondsLeft(getRepostSecondsLeft());
    const interval = setInterval(() => {
      const remaining = getRepostSecondsLeft();
      setRepostSecondsLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [isExpired, errand?.updatedAt, getRepostSecondsLeft]);

  const handleRepost = () => {
    if (!errand) return;
    router.push({
      pathname: "/requester/createErrand",
      params: {
        title: errand.title,
        description: errand.description,
        firstLocation: errand.firstLocation,
        finalLocation: errand.finalLocation,
        locationReference: errand.locationReference ?? "",
        type: errand.type,
      } as CreateErrandInput,
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <BackButton onBack={() => router.replace("/requester/home")} />
          <Text style={[styles.pageTitle, { color: colors.text }]}>
            Errand Details
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {isLoading ? (
          <LoadingSpinner fullScreen />
        ) : !errand ? (
          <EmptyState fullScreen isError message="Errand not found" />
        ) : (
          <>
            {/* Stepper */}
            <ErrandStepper currentStep={errand.status} />

            {/* Errand Info */}
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.cardRow}>
                <Text
                  style={[
                    styles.badge,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      color: colors.text,
                    },
                  ]}
                >
                  {formatErrandType(errand.type)}
                </Text>
                {errand.isFavour ? (
                  <Text style={[styles.amount, { color: colors.success }]}>
                    Favour 🤝
                  </Text>
                ) : (
                  displayAmount != null && (
                    <Text style={[styles.amount, { color: colors.primary }]}>
                      £{displayAmount.toFixed(2)}
                      {errand.type === "HANDS_ON_HELP" ? "/hr" : ""}
                    </Text>
                  )
                )}
              </View>
              <Text style={[styles.title, { color: colors.text }]}>
                {errand.title}
              </Text>
              {/* Checklist */}
              {parseChecklist(errand.description).length > 0 && (
                <View style={styles.checklistCard}>
                  {parseChecklist(errand.description).map(
                    (item, index, arr) => (
                      <View
                        key={index}
                        style={[
                          styles.checklistRow,
                          index < arr.length - 1 && {
                            borderBottomWidth: 1,
                            borderBottomColor: colors.border,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.checklistBullet,
                            { backgroundColor: colors.primary },
                          ]}
                        />
                        <Text
                          style={[
                            styles.checklistItemText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {item}
                        </Text>
                      </View>
                    ),
                  )}
                </View>
              )}
              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />
              <View style={styles.locationRow}>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={colors.textTertiary}
                />
                <Text
                  style={[styles.locationText, { color: colors.textSecondary }]}
                >
                  {errand.firstLocation}
                </Text>
              </View>
              {errand.type !== "HANDS_ON_HELP" && (
                <View style={styles.locationRow}>
                  <Ionicons
                    name="navigate-outline"
                    size={16}
                    color={colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.locationText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {errand.finalLocation}
                  </Text>
                </View>
              )}
              {errand.locationReference && (
                <View style={styles.locationRow}>
                  <Ionicons
                    name="document-text-outline"
                    size={16}
                    color={colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.locationText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Ref: {errand.locationReference}
                  </Text>
                </View>
              )}
            </View>

            {/* Helper Info */}
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {isCompleted ? "Completed by" : "Your Helper"}
              </Text>
              {errand.helper ? (
                <View style={styles.helperRow}>
                  <Avatar
                    firstName={errand.helper.firstName}
                    lastName={errand.helper.lastName}
                    uri={errand.helper.avatarUrl ?? undefined}
                    size={48}
                  />
                  <View style={styles.helperInfo}>
                    <Text style={[styles.helperName, { color: colors.text }]}>
                      {errand.helper.firstName} {errand.helper.lastName}
                    </Text>
                  </View>
                  {!isCompleted && !isTerminal && (
                    <TouchableOpacity
                      style={[
                        styles.contact,
                        { backgroundColor: colors.primary },
                      ]}
                      onPress={() => {
                        return router.push({
                          pathname: "/requester/chat",
                          params: {
                            errandId: errand.id,
                            helperName: `${errand.helper.firstName} ${errand.helper.lastName}`,
                            otherPersonPhone: errand.helper.phone,
                          },
                        });
                      }}
                    >
                      <Ionicons
                        name="chatbubble-outline"
                        size={16}
                        color="#fff"
                      />
                      <Text style={styles.contactText}>Message</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.noHelperRow}>
                  {isExpired ? (
                    <>
                      <Ionicons
                        name="time-outline"
                        size={20}
                        color={colors.error}
                      />
                      <Text
                        style={[styles.noHelperText, { color: colors.error }]}
                      >
                        No helpers were available for this errand
                      </Text>
                    </>
                  ) : (
                    <>
                      <LoadingSpinner size="small" color={colors.primary} />
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text
                          style={[
                            styles.noHelperText,
                            { color: colors.text, fontWeight: "600" },
                          ]}
                        >
                          Searching for a helper...
                        </Text>
                        <Text
                          style={[
                            styles.noHelperSubtext,
                            { color: colors.textTertiary },
                          ]}
                        >
                          {"We'll notify you as soon as one is found"}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              )}
            </View>
            {/* Completed info */}
            {isCompleted && (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.cardRow}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {errand.isFavour ? "Payment" : "Amount Paid"}
                  </Text>
                  {errand.isFavour ? (
                    <Text style={[styles.amount, { color: colors.success }]}>
                      Favour 🤝
                    </Text>
                  ) : (
                    <Text style={[styles.amount, { color: colors.primary }]}>
                      £
                      {(errand.type === "HANDS_ON_HELP" &&
                      errand.finalCost != null
                        ? errand.finalCost
                        : displayAmount
                      )?.toFixed(2) ?? "—"}
                    </Text>
                  )}
                </View>
                {errand.completedAt && (
                  <View style={styles.cardRow}>
                    <Text
                      style={[
                        styles.locationText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Completed
                    </Text>
                    <Text
                      style={[
                        styles.locationText,
                        {
                          color: colors.textSecondary,
                          textAlign: "right",
                        },
                      ]}
                    >
                      {new Date(errand.completedAt).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Review completion CTA */}
            {isReviewing && (
              <TouchableOpacity
                style={[
                  styles.reviewButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() =>
                  router.push(
                    `/requester/review-completion?errandId=${errand.id}`,
                  )
                }
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="#fff"
                />
                <Text style={styles.reviewButtonText}>Review Completion</Text>
              </TouchableOpacity>
            )}

            {(isExpired || isCompleted) && (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.cardRow}>
                  <Ionicons
                    name="refresh-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.locationText,
                      { color: colors.textSecondary, flex: 1 },
                    ]}
                  >
                    {repostSecondsLeft > 0
                      ? `You can repost this errand in ${formatTimeRemaining(repostSecondsLeft)}`
                      : isCompleted
                        ? "Want this errand ran again?"
                        : "Ready to repost this errand?"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.repostButton,
                    {
                      backgroundColor:
                        repostSecondsLeft > 0 ? colors.border : colors.primary,
                    },
                  ]}
                  onPress={handleRepost}
                  disabled={repostSecondsLeft > 0}
                >
                  <Text style={styles.repostButtonText}>
                    {repostSecondsLeft > 0
                      ? `Repost in ${formatTimeRemaining(repostSecondsLeft)}`
                      : isCompleted
                        ? "Rerun Errand"
                        : "Repost Errand"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Terminal state notice */}
            {isTerminal && (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.error + "15",
                    borderColor: colors.error,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.locationText,
                    { color: colors.error, textAlign: "center" },
                  ]}
                >
                  {errand.status === "CANCELLED"
                    ? "This errand was cancelled."
                    : "This errand is under dispute. Our team will review it shortly."}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Emergency FAB — only when active */}
      {isActive && (
        <TouchableOpacity
          onPress={() => router.push("/requester/emergency")}
          style={[styles.fab, { backgroundColor: colors.error }]}
        >
          <Ionicons name="warning-outline" size={22} color="#fff" />
          <Text style={styles.fabText}>Emergency</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

export default ErrandDetails;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    display: "flex",
    flexDirection: "column",
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 12,
  },
  pageTitle: { fontSize: 18, fontWeight: "700" },
  card: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 12 },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "500",
  },
  amount: { fontSize: 20, fontWeight: "700" },
  title: { fontSize: 18, fontWeight: "700" },
  description: { fontSize: 14, lineHeight: 20 },
  checklistCard: {
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "transparent",
  },
  checklistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 2,
    paddingVertical: 6,
  },
  checklistBullet: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  checklistItemText: { flex: 1, fontSize: 14, lineHeight: 20 },
  divider: { height: 1 },
  locationRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  locationText: { fontSize: 14, flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: "600" },
  helperRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  helperInfo: { flex: 1, gap: 4 },
  helperName: { fontSize: 16, fontWeight: "600" },
  noHelperRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  noHelperText: { fontSize: 14, fontStyle: "italic" },
  noHelperSubtext: { fontSize: 12 },
  contact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  contactText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  reviewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  reviewButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 999,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  repostButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  repostButtonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
