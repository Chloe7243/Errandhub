import Avatar from "@/components/avatar";
import EmptyState from "@/components/empty-state";
import ErrandStepper from "@/components/errand-stepper";
import BackButton from "@/components/ui/back-button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  useGetErrandByIdQuery,
  useAcceptOfferMutation,
  useDeclineOfferMutation,
} from "@/store/api/errand";
import { formatErrandType } from "@/utils/errand";
import { displayErrorMessage } from "@/utils/errors";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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
  const { currentData, isLoading } = useGetErrandByIdQuery(id!, {
    refetchOnMountOrArgChange: true,
  });

  const router = useRouter();
  const colorScheme = useColorScheme();
  const errand = currentData?.errand;
  const colors = Colors[colorScheme ?? "dark"];
  const [acceptBid, { isLoading: isAccepting }] = useAcceptOfferMutation();
  const [declineBid, { isLoading: isDeclining }] = useDeclineOfferMutation();

  const isActive = errand?.status === "IN_PROGRESS";
  const isCompleted = errand?.status === "COMPLETED";
  const isReviewing = errand?.status === "REVIEWING";
  const isTerminal =
    errand?.status === "CANCELLED" || errand?.status === "DISPUTED";
  const displayAmount = errand?.agreedPrice ?? errand?.suggestedPrice;
  const pendingBids = errand?.bids ?? [];

  console.log({ errand });

  const handleAcceptBid = async (bidId: string) => {
    try {
      await acceptBid({ errandId: errand!.id, bidId }).unwrap();
      Toast.show({ type: "success", text1: "Helper accepted!" });
    } catch (err) {
      displayErrorMessage(err);
    }
  };

  const handleDeclineBid = async (bidId: string) => {
    try {
      await declineBid({ errandId: errand!.id, bidId }).unwrap();
      Toast.show({ type: "success", text1: "Bid declined" });
    } catch (err) {
      displayErrorMessage(err);
    }
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
          <BackButton />
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

            {/* Map — only when in progress */}
            {isActive && (
              <View
                style={[
                  styles.mapContainer,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.mapPlaceholder}>
                  <Ionicons
                    name="map-outline"
                    size={32}
                    color={colors.textTertiary}
                  />
                  <Text
                    style={[styles.mapText, { color: colors.textTertiary }]}
                  >
                    Map Loading...
                  </Text>
                </View>
                <View
                  style={[styles.etaBar, { backgroundColor: colors.surface }]}
                >
                  <View style={styles.etaStat}>
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={[styles.etaValue, { color: colors.text }]}>
                      12 min
                    </Text>
                    <Text
                      style={[styles.etaLabel, { color: colors.textTertiary }]}
                    >
                      ETA
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.etaDivider,
                      { backgroundColor: colors.border },
                    ]}
                  />
                  <View style={styles.etaStat}>
                    <Ionicons
                      name="navigate-outline"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={[styles.etaValue, { color: colors.text }]}>
                      0.8 mi
                    </Text>
                    <Text
                      style={[styles.etaLabel, { color: colors.textTertiary }]}
                    >
                      Away
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.etaDivider,
                      { backgroundColor: colors.border },
                    ]}
                  />
                  <View style={styles.etaStat}>
                    <Ionicons name="ellipse" size={10} color={colors.success} />
                    <Text style={[styles.etaValue, { color: colors.text }]}>
                      En Route
                    </Text>
                    <Text
                      style={[styles.etaLabel, { color: colors.textTertiary }]}
                    >
                      Status
                    </Text>
                  </View>
                </View>
              </View>
            )}

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
                {displayAmount ? (
                  <Text style={[styles.amount, { color: colors.primary }]}>
                    £{displayAmount.toFixed(2)}
                  </Text>
                ) : (
                  <Text
                    style={[
                      styles.amountPending,
                      { color: colors.textTertiary },
                    ]}
                  >
                    Awaiting bids
                  </Text>
                )}
              </View>
              <Text style={[styles.title, { color: colors.text }]}>
                {errand.title}
              </Text>
              <Text
                style={[styles.description, { color: colors.textSecondary }]}
              >
                {errand.description}
              </Text>
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
                  {errand.pickupLocation}
                </Text>
              </View>
              <View style={styles.locationRow}>
                <Ionicons
                  name="navigate-outline"
                  size={16}
                  color={colors.textTertiary}
                />
                <Text
                  style={[styles.locationText, { color: colors.textSecondary }]}
                >
                  {errand.dropoffLocation}
                </Text>
              </View>
              {errand.pickupReference && (
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
                    Ref: {errand.pickupReference}
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
                          },
                        });
                      }}
                    >
                      <Ionicons
                        name="chatbubble-outline"
                        size={20}
                        color="#fff"
                      />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.noHelperRow}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.noHelperText,
                      { color: colors.textTertiary },
                    ]}
                  >
                    {pendingBids.length > 0
                      ? `${pendingBids.length} helper${pendingBids.length > 1 ? "s" : ""} interested — review bids below`
                      : "Waiting for a helper to bid"}
                  </Text>
                </View>
              )}
            </View>
            {/* Bids — only show pending bids when status is POSTED */}
            {errand.status === "POSTED" && pendingBids.length > 0 && (
              <View
                style={[{ display: "flex", flexDirection: "column", gap: 12 }]}
              >
                <View style={styles.cardRow}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Bids
                  </Text>
                  <Text
                    style={[styles.bidCount, { color: colors.textTertiary }]}
                  >
                    {pendingBids.length} pending
                  </Text>
                </View>

                {pendingBids.map((bid: any) => (
                  <View
                    key={bid.id}
                    style={[
                      styles.bidCard,
                      {
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.bidHeader}>
                      <Avatar
                        firstName={bid.helper?.firstName}
                        lastName={bid.helper?.lastName}
                        uri={bid.helper?.avatarUrl ?? undefined}
                        size={40}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.helperName, { color: colors.text }]}
                        >
                          {bid.helper?.firstName} {bid.helper?.lastName}
                        </Text>
                        <Text
                          style={[
                            styles.bidTime,
                            { color: colors.textTertiary },
                          ]}
                        >
                          {new Date(bid.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </View>
                      <Text
                        style={[styles.bidAmount, { color: colors.primary }]}
                      >
                        £{bid.amount.toFixed(2)}
                      </Text>
                    </View>

                    <View style={styles.bidActions}>
                      <TouchableOpacity
                        style={[
                          styles.declineBtn,
                          {
                            backgroundColor: colors.error,
                            borderColor: colors.error,
                          },
                        ]}
                        onPress={() => handleDeclineBid(bid.id)}
                        disabled={isAccepting || isDeclining}
                      >
                        <Text style={[styles.declineBtnText]}>Decline</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.acceptBtn,
                          {
                            backgroundColor: colors.success,
                            opacity: isAccepting ? 0.7 : 1,
                          },
                        ]}
                        onPress={() => handleAcceptBid(bid.id)}
                        disabled={isAccepting || isDeclining}
                      >
                        <Text style={styles.acceptBtnText}>Accept</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* No bids yet */}
            {errand.status === "POSTED" && pendingBids.length === 0 && (
              <View
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Bids
                </Text>
                <EmptyState
                  containerStyle={[
                    styles.card,
                    {
                      flex: 1,
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  variant="card"
                  icon="hourglass-outline"
                  message="No bids yet — helpers will be notified"
                />
              </View>
            )}

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
                    Amount Paid
                  </Text>
                  <Text style={[styles.amount, { color: colors.primary }]}>
                    £{displayAmount?.toFixed(2) ?? "—"}
                  </Text>
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
                        { color: colors.textSecondary },
                      ]}
                    >
                      {new Date(errand.completedAt).toLocaleDateString()}
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
    flex: 1,
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
  mapContainer: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  mapPlaceholder: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  mapText: { fontSize: 14 },
  etaBar: { flexDirection: "row", alignItems: "center", padding: 14 },
  etaStat: { flex: 1, alignItems: "center", gap: 2 },
  etaValue: { fontSize: 15, fontWeight: "700" },
  etaLabel: { fontSize: 11 },
  etaDivider: { width: 1, height: 36 },
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
  amountPending: { fontSize: 12, fontStyle: "italic" },
  title: { fontSize: 18, fontWeight: "700" },
  description: { fontSize: 14, lineHeight: 20 },
  divider: { height: 1 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  locationText: { fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "600" },
  helperRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  helperInfo: { flex: 1, gap: 4 },
  helperName: { fontSize: 16, fontWeight: "600" },
  noHelperRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  noHelperText: { fontSize: 14, fontStyle: "italic" },
  contact: { padding: 10, borderRadius: 10 },
  bidCount: { fontSize: 13 },
  bidCard: { padding: 12, borderRadius: 10, borderWidth: 1, gap: 12 },
  bidHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  bidAmount: { fontSize: 18, fontWeight: "700" },
  bidTime: { fontSize: 12, marginTop: 2 },
  bidActions: { flexDirection: "row", gap: 10 },
  declineBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  declineBtnText: { fontSize: 14, fontWeight: "500", color: "#fff" },
  acceptBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  acceptBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
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
});
