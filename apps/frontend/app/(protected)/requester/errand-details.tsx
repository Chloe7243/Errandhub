import Avatar from "@/components/avatar";
import CounterOfferModal from "@/components/counter-offer-modal";
import EmptyState from "@/components/empty-state";
import ErrandStepper from "@/components/errand-stepper";
import BackButton from "@/components/ui/back-button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { RootState } from "@/store";
import {
  useAcceptOfferMutation,
  useDeclineOfferMutation,
  useGetErrandByIdQuery,
} from "@/store/api/errand";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearCounterOffer } from "@/store/slices";
import { parseChecklist } from "@/store/slices/checklist";
import { formatErrandType } from "@/utils/errand";
import { displayErrorMessage } from "@/utils/errors";
import { getSocket } from "@/utils/socket";
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
  const dispatch = useAppDispatch();
  const colorScheme = useColorScheme();
  const errand = currentData?.errand;
  const colors = Colors[colorScheme ?? "dark"];
  const [acceptOffer, { isLoading: isAccepting }] = useAcceptOfferMutation();
  const [declineOffer, { isLoading: isDeclining }] = useDeclineOfferMutation();
  const expiredErrandId = useAppSelector(
    (state: RootState) => state.matching.expiredErrandId,
  );

  useEffect(() => {
    if (expiredErrandId === id) refetch();
  }, [expiredErrandId, id, refetch]);

  // Only show the counter offer modal if it's for this errand
  const counterOffer = useAppSelector((state: RootState) =>
    state.matching.counterOffer?.errandId === id
      ? state.matching.counterOffer
      : null,
  );

  const handleCounterOfferAccept = () => {
    const socket = getSocket();
    if (!socket || !counterOffer) return;
    socket.emit("offer_response", {
      errandId: counterOffer.errandId,
      accept: true,
    });
    dispatch(clearCounterOffer());
  };

  const handleCounterOfferDecline = () => {
    const socket = getSocket();
    if (!socket || !counterOffer) return;
    socket.emit("offer_response", {
      errandId: counterOffer.errandId,
      accept: false,
    });
    dispatch(clearCounterOffer());
  };

  const isActive = errand?.status === "IN_PROGRESS";
  const isCompleted = errand?.status === "COMPLETED";
  const isReviewing = errand?.status === "REVIEWING";
  const isExpired = errand?.status === "EXPIRED";
  const isTerminal =
    errand?.status === "CANCELLED" || errand?.status === "DISPUTED";
  const displayAmount = errand?.agreedPrice ?? errand?.suggestedPrice;
  const pendingOffers = errand?.offers ?? [];

  // Seconds until the 2-minute repost cooldown expires
  const getRepostSecondsLeft = useCallback(
    () =>
      errand?.updatedAt
        ? Math.max(
            0,
            Math.ceil(
              (new Date(errand.updatedAt).getTime() + 3 * 1000 - Date.now()) /
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
        pickupLocation: errand.pickupLocation,
        dropoffLocation: errand.dropoffLocation,
        pickupReference: errand.pickupReference ?? "",
        type: errand.type,
      } as CreateErrandInput,
    });
  };

  const handleAcceptOffer = async (offerId: string) => {
    try {
      await acceptOffer({ errandId: errand!.id, offerId }).unwrap();
      Toast.show({ type: "success", text1: "Helper accepted!" });
    } catch (err) {
      displayErrorMessage(err);
    }
  };

  const handleDeclineOffer = async (offerId: string) => {
    try {
      await declineOffer({ errandId: errand!.id, offerId }).unwrap();
      Toast.show({ type: "success", text1: "Offer declined" });
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
                    Awaiting offers
                  </Text>
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
                            otherPersonPhone: errand.helper.phone,
                          },
                        });
                      }}
                    >
                      <Ionicons name="chatbubble-outline" size={16} color="#fff" />
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
                  ) : pendingOffers.length === 0 ? (
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
                  ) : (
                    <>
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
                        {`${pendingOffers.length} helper${pendingOffers.length > 1 ? "s" : ""} interested — review offers below`}
                      </Text>
                    </>
                  )}
                </View>
              )}
            </View>
            {/* Offers — only show pending offers when status is POSTED */}
            {errand.status === "POSTED" && pendingOffers.length > 0 && (
              <View
                style={[{ display: "flex", flexDirection: "column", gap: 12 }]}
              >
                <View style={styles.cardRow}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Offers
                  </Text>
                  <Text
                    style={[styles.offerCount, { color: colors.textTertiary }]}
                  >
                    {pendingOffers.length} pending
                  </Text>
                </View>

                {pendingOffers.map((offer: any) => (
                  <View
                    key={offer.id}
                    style={[
                      styles.offerCard,
                      {
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.offerHeader}>
                      <Avatar
                        firstName={offer.helper?.firstName}
                        lastName={offer.helper?.lastName}
                        uri={offer.helper?.avatarUrl ?? undefined}
                        size={40}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.helperName, { color: colors.text }]}
                        >
                          {offer.helper?.firstName} {offer.helper?.lastName}
                        </Text>
                        <Text
                          style={[
                            styles.offerTime,
                            { color: colors.textTertiary },
                          ]}
                        >
                          {new Date(offer.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </View>
                      <Text
                        style={[styles.offerAmount, { color: colors.primary }]}
                      >
                        £{offer.amount.toFixed(2)}
                      </Text>
                    </View>

                    <View style={styles.offerActions}>
                      <TouchableOpacity
                        style={[
                          styles.declineBtn,
                          {
                            backgroundColor: colors.error,
                            borderColor: colors.error,
                          },
                        ]}
                        onPress={() => handleDeclineOffer(offer.id)}
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
                        onPress={() => handleAcceptOffer(offer.id)}
                        disabled={isAccepting || isDeclining}
                      >
                        <Text style={styles.acceptBtnText}>Accept</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* No offers yet */}
            {errand.status === "POSTED" && pendingOffers.length === 0 && (
              <View
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Offers
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
                  message="No offers yet — helpers will be notified"
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
          style={[styles.fab, { backgroundColor: colors.error }]}
        >
          <Ionicons name="warning-outline" size={22} color="#fff" />
          <Text style={styles.fabText}>Emergency</Text>
        </TouchableOpacity>
      )}

      <CounterOfferModal
        counterOffer={counterOffer}
        onAccept={handleCounterOfferAccept}
        onDecline={handleCounterOfferDecline}
      />
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
  amountPending: { fontSize: 12, fontStyle: "italic" },
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
  offerCount: { fontSize: 13 },
  offerCard: { padding: 12, borderRadius: 10, borderWidth: 1, gap: 12 },
  offerHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  offerAmount: { fontSize: 18, fontWeight: "700" },
  offerTime: { fontSize: 12, marginTop: 2 },
  offerActions: { flexDirection: "row", gap: 10 },
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
  repostButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  repostButtonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
