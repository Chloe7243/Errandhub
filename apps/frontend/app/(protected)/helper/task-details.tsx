import Avatar from "@/components/avatar";
import EmptyState from "@/components/empty-state";
import LoadingSpinner from "@/components/ui/loading-spinner";
import MapPreview from "@/components/ui/map-preview";
import BackButton from "@/components/ui/back-button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  useGetErrandByIdQuery,
  useSubmitOfferMutation,
  useUpdateErrandStatusMutation,
  useAcceptErrandMutation,
} from "@/store/api/errand";
import { formatErrandType, formatErrandStatus } from "@/utils/errand";
import { displayErrorMessage } from "@/utils/errors";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useAppDispatch } from "@/store/hooks";

const HelperErrandDetails = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const { id } = useLocalSearchParams<{ id: string }>();

  const [offerAmount, setOfferAmount] = useState("");
  const [showNegotiate, setShowNegotiate] = useState(false);

  const {
    currentData: data,
    isLoading,
    isError,
  } = useGetErrandByIdQuery(id!, {
    refetchOnMountOrArgChange: true,
  });
  const [submitOffer, { isLoading: isSubmitting }] = useSubmitOfferMutation();
  const [updateStatus, { isLoading: isUpdating }] =
    useUpdateErrandStatusMutation();
  const [acceptErrand, { isLoading: isAccepting }] = useAcceptErrandMutation();

  const errand = data?.errand;
  const isPosted = errand?.status === "POSTED";
  const isActive =
    errand?.status === "IN_PROGRESS" || errand?.status === "ACCEPTED";
  const hasOffer = errand?.offers?.length > 0;
  const myOffer = errand?.offers?.[0];
  const displayAmount = errand?.agreedPrice ?? errand?.suggestedPrice;
  const basePrice = errand?.suggestedPrice || 5;
  const maxPrice = basePrice * 2;

  const handleAccept = async () => {
    try {
      await acceptErrand(id).unwrap();
      Toast.show({ type: "success", text1: "Errand accepted" });
    } catch (err) {
      displayErrorMessage(err);
    }
  };

  const handleDecline = () => {
    try {
      // socket.emit("decline_errand", { errandId, helperId: user.userId });
      router.back();
    } catch (err) {
      displayErrorMessage(err);
    }
  };

  const handleSubmitOffer = async () => {
    const amount = parseFloat(offerAmount);
    if (!amount || amount <= 0) {
      Toast.show({ type: "error", text1: "Please enter a valid amount" });
      return;
    }
    try {
      await submitOffer({ errandId: id!, offerAmount: amount }).unwrap();
      Toast.show({ type: "success", text1: "Offer sent" });
      setOfferAmount("");
      setShowNegotiate(false);
    } catch (err) {
      displayErrorMessage(err);
    }
  };

  const handleMarkComplete = () => {
    router.push(`/helper/upload-proof?errandId=${id}`);
  };

  const handleNavigate = () => {
    if (!errand?.pickupLat || !errand?.pickupLng) return;
    const url =
      Platform.OS === "ios"
        ? `maps:?daddr=${errand.pickupLat},${errand.pickupLng}`
        : `geo:${errand.pickupLat},${errand.pickupLng}?q=${errand.pickupLat},${errand.pickupLng}`;
    Linking.openURL(url);
  };

  const handleStartErrand = async () => {
    try {
      await updateStatus({ errandId: id!, status: "IN_PROGRESS" }).unwrap();
      Toast.show({ type: "success", text1: "Errand started" });
    } catch (err) {
      displayErrorMessage(err);
    }
  };

  const adjustOffer = (direction: "up" | "down") => {
    const current = parseFloat(offerAmount) || basePrice;
    if (direction === "up" && current + 0.5 <= maxPrice) {
      setOfferAmount((current + 0.5).toFixed(2));
    }
    if (direction === "down" && current - 0.5 >= basePrice) {
      setOfferAmount((current - 0.5).toFixed(2));
    }
  };

  const currentOffer = parseFloat(offerAmount) || basePrice;
  const fillPercent =
    maxPrice > basePrice
      ? ((currentOffer - basePrice) / (maxPrice - basePrice)) * 100
      : 0;

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (isError || !errand)
    return <EmptyState fullScreen isError message="Errand not found" />;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <BackButton />
          <Text style={[styles.pageTitle, { color: colors.text }]}>
            Task Details
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Map */}
          <View
            style={[styles.mapSection, { borderBottomColor: colors.border }]}
          >
            {errand.pickupLat && errand.pickupLng ? (
              <MapPreview
                pickupLat={errand.pickupLat}
                pickupLng={errand.pickupLng}
                dropoffLat={errand.dropoffLat ?? undefined}
                dropoffLng={errand.dropoffLng ?? undefined}
              />
            ) : (
              <View
                style={[
                  styles.mapPlaceholder,
                  { backgroundColor: colors.backgroundSecondary },
                ]}
              >
                <Ionicons
                  name="map-outline"
                  size={32}
                  color={colors.textTertiary}
                />
                <Text style={[styles.mapText, { color: colors.textTertiary }]}>
                  Map not available
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={[
                styles.navigateBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: errand.pickupLat ? 1 : 0.4,
                },
              ]}
              onPress={handleNavigate}
              disabled={!errand.pickupLat}
            >
              <Ionicons name="navigate-outline" size={14} color="#fff" />
              <Text style={styles.navigateBtnText}>Navigate to Pickup</Text>
            </TouchableOpacity>
          </View>

          {/* Task Header */}
          <View style={styles.section}>
            <View style={styles.row}>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  {formatErrandType(errand.type)}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Ionicons name="ellipse" size={10} color={colors.warning} />
                <Text style={[styles.statusText, { color: colors.warning }]}>
                  {formatErrandStatus(errand.status)}
                </Text>
              </View>
            </View>

            <View style={styles.row}>
              <Text
                style={[styles.taskTitle, { color: colors.text }]}
                numberOfLines={2}
              >
                {errand.title}
              </Text>
              <Text style={[styles.taskPrice, { color: colors.primary }]}>
                £{displayAmount?.toFixed(2) ?? "—"}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Ionicons
                name="time-outline"
                size={13}
                color={colors.textSecondary}
              />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {new Date(errand.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Requester */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Requester
            </Text>
            <View style={styles.requesterRow}>
              <Avatar
                firstName={errand.requester?.firstName ?? ""}
                lastName={errand.requester?.lastName ?? ""}
                uri={errand.requester?.avatarUrl ?? undefined}
                size={44}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.requesterName, { color: colors.text }]}>
                  {errand.requester?.firstName} {errand.requester?.lastName}
                </Text>
                <Text
                  style={[styles.requesterSub, { color: colors.textSecondary }]}
                >
                  Requester
                </Text>
              </View>
              {isActive && (
                <TouchableOpacity
                  style={[
                    styles.iconButton,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: "/helper/chat",
                      params: {
                        errandId: errand.id,
                        requesterName: `${errand.requester.firstName} ${errand.requester.lastName}`,
                        otherPersonPhone: errand.requester.phone,
                      },
                    })
                  }
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={18}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Description
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {errand.description}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Locations */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Locations
            </Text>
            <View style={styles.locationBlock}>
              <View style={styles.locationRow}>
                <View
                  style={[
                    styles.locationDot,
                    { backgroundColor: colors.primary },
                  ]}
                />
                <View>
                  <Text
                    style={[
                      styles.locationLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Pickup
                  </Text>
                  <Text style={[styles.locationValue, { color: colors.text }]}>
                    {errand.pickupLocation}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.locationLine,
                  { backgroundColor: colors.border },
                ]}
              />
              <View style={styles.locationRow}>
                <View
                  style={[styles.locationDot, { backgroundColor: colors.cta }]}
                />
                <View>
                  <Text
                    style={[
                      styles.locationLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Drop-off
                  </Text>
                  <Text style={[styles.locationValue, { color: colors.text }]}>
                    {errand.dropoffLocation}
                  </Text>
                </View>
              </View>
              {errand.pickupReference && (
                <>
                  <View
                    style={[
                      styles.divider,
                      {
                        backgroundColor: colors.border,
                        marginHorizontal: 0,
                        marginVertical: 8,
                      },
                    ]}
                  />
                  <View style={styles.metaRow}>
                    <Ionicons
                      name="document-text-outline"
                      size={14}
                      color={colors.textTertiary}
                    />
                    <Text
                      style={[styles.metaText, { color: colors.textSecondary }]}
                    >
                      Ref: {errand.pickupReference}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Response Section — only when posted */}
          {isPosted && (
            <View style={styles.section}>
              {hasOffer ? (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Your Offer
                  </Text>
                  <View
                    style={[
                      styles.offerConfirmed,
                      {
                        backgroundColor: colors.success + "15",
                        borderColor: colors.success,
                      },
                    ]}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={20}
                      color={colors.success}
                    />
                    <View>
                      <Text
                        style={[
                          styles.offerConfirmedTitle,
                          { color: colors.success },
                        ]}
                      >
                        Offer Sent
                      </Text>
                      <Text
                        style={[
                          styles.offerConfirmedSub,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Your offer: £{myOffer?.amount?.toFixed(2)} — waiting for
                        requester to respond
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Respond to Task
                  </Text>

                  {errand.suggestedPrice && (
                    <View
                      style={[
                        styles.suggestedRow,
                        {
                          backgroundColor: colors.backgroundSecondary,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name="information-circle-outline"
                        size={16}
                        color={colors.primary}
                      />
                      <Text
                        style={[
                          styles.suggestedText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Suggested price:{" "}
                        <Text
                          style={{ color: colors.primary, fontWeight: "700" }}
                        >
                          £{errand.suggestedPrice.toFixed(2)}
                        </Text>
                      </Text>
                    </View>
                  )}

                  {/* Accept */}
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: colors.success,
                        opacity: isAccepting ? 0.7 : 1,
                      },
                    ]}
                    onPress={handleAccept}
                    disabled={isAccepting}
                  >
                    {isAccepting ? (
                      <LoadingSpinner size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={18}
                          color="#fff"
                        />
                        <Text style={styles.actionBtnText}>
                          Accept at £{errand.suggestedPrice?.toFixed(2) ?? "—"}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Negotiate */}
                  {showNegotiate ? (
                    <View
                      style={[
                        styles.negotiateContainer,
                        {
                          backgroundColor: colors.backgroundSecondary,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.offerAmountDisplay,
                          { color: colors.text },
                        ]}
                      >
                        £{currentOffer.toFixed(2)}
                      </Text>
                      <View style={styles.sliderRow}>
                        <TouchableOpacity
                          style={[
                            styles.stepButton,
                            {
                              backgroundColor: colors.background,
                              borderColor: colors.border,
                            },
                          ]}
                          onPress={() => adjustOffer("down")}
                        >
                          <Ionicons
                            name="remove"
                            size={20}
                            color={colors.text}
                          />
                        </TouchableOpacity>
                        <View style={styles.sliderTrackContainer}>
                          <View
                            style={[
                              styles.sliderTrack,
                              { backgroundColor: colors.border },
                            ]}
                          />
                          <View
                            style={[
                              styles.sliderFill,
                              {
                                backgroundColor: colors.primary,
                                width: `${fillPercent}%`,
                              },
                            ]}
                          />
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.stepButton,
                            {
                              backgroundColor: colors.background,
                              borderColor: colors.border,
                            },
                          ]}
                          onPress={() => adjustOffer("up")}
                        >
                          <Ionicons name="add" size={20} color={colors.text} />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.sliderLabels}>
                        <Text
                          style={[
                            styles.sliderLabel,
                            { color: colors.textTertiary },
                          ]}
                        >
                          £{basePrice.toFixed(2)}
                        </Text>
                        <Text
                          style={[
                            styles.sliderLabel,
                            { color: colors.textTertiary },
                          ]}
                        >
                          £{maxPrice.toFixed(2)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.actionBtn,
                          {
                            backgroundColor: colors.primary,
                            opacity: isSubmitting ? 0.7 : 1,
                          },
                        ]}
                        onPress={handleSubmitOffer}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <LoadingSpinner size="small" color="#fff" />
                        ) : (
                          <Text style={styles.actionBtnText}>
                            Make Offer — £{currentOffer.toFixed(2)}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        { backgroundColor: colors.primary },
                      ]}
                      onPress={() => {
                        setOfferAmount(basePrice.toFixed(2));
                        setShowNegotiate(true);
                      }}
                      disabled={isAccepting}
                    >
                      <Ionicons
                        name="pricetag-outline"
                        size={18}
                        color="#fff"
                      />
                      <Text style={styles.actionBtnText}>Negotiate Price</Text>
                    </TouchableOpacity>
                  )}

                  {/* Decline */}
                  <TouchableOpacity
                    style={[
                      styles.declineBtn,
                      {
                        borderColor: colors.error,
                        opacity: 1,
                      },
                    ]}
                    onPress={handleDecline}
                    disabled={isAccepting}
                  >
                    <>
                      <Ionicons
                        name="close-circle-outline"
                        size={18}
                        color={colors.error}
                      />
                      <Text
                        style={[styles.declineBtnText, { color: colors.error }]}
                      >
                        Decline
                      </Text>
                    </>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* Actions — when accepted or in progress */}
          {isActive && (
            <View style={styles.section}>
              {errand.status === "ACCEPTED" && (
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: colors.primary,
                      opacity: isUpdating ? 0.7 : 1,
                    },
                  ]}
                  onPress={handleStartErrand}
                  disabled={isUpdating}
                >
                  <Ionicons name="play-outline" size={18} color="#fff" />
                  <Text style={styles.actionBtnText}>Start Errand</Text>
                </TouchableOpacity>
              )}
              {errand.status === "IN_PROGRESS" && (
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: colors.success,
                      opacity: isUpdating ? 0.7 : 1,
                    },
                  ]}
                  onPress={handleMarkComplete}
                  disabled={isUpdating}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.actionBtnText}>Mark as Complete</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default HelperErrandDetails;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  pageTitle: { fontSize: 20, fontWeight: "700" },
  content: { paddingBottom: 40 },
  mapSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
    borderBottomWidth: 1,
  },
  mapPlaceholder: {
    height: 160,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  mapText: { fontSize: 14 },
  navigateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  navigateBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  section: { paddingHorizontal: 16, paddingVertical: 16, gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "600" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusText: { fontSize: 13, fontWeight: "500" },
  taskTitle: { fontSize: 18, fontWeight: "700", flex: 1, marginRight: 12 },
  taskPrice: { fontSize: 18, fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 14 },
  divider: { height: 1, marginHorizontal: 16 },
  requesterRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  requesterName: { fontSize: 15, fontWeight: "600" },
  requesterSub: { fontSize: 12, marginTop: 2 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  description: { fontSize: 14, lineHeight: 22 },
  locationBlock: { gap: 4 },
  locationRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  locationDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  locationLine: { width: 2, height: 20, marginLeft: 4, marginVertical: 2 },
  locationLabel: { fontSize: 12, marginBottom: 2 },
  locationValue: { fontSize: 14, fontWeight: "500" },
  suggestedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  suggestedText: { fontSize: 13, flex: 1 },
  offerConfirmed: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  offerConfirmedTitle: { fontSize: 14, fontWeight: "700" },
  offerConfirmedSub: { fontSize: 13, marginTop: 2 },
  negotiateContainer: {
    gap: 12,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  offerAmountDisplay: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sliderTrackContainer: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  sliderTrack: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 3,
  },
  sliderFill: {
    height: "100%",
    borderRadius: 3,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderLabel: {
    fontSize: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 10,
  },
  actionBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  declineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  declineBtnText: { fontSize: 15, fontWeight: "600" },
});
