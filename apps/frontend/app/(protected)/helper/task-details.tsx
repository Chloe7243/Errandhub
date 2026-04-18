import Avatar from "@/components/avatar";
import EmptyState from "@/components/empty-state";
import LoadingSpinner from "@/components/ui/loading-spinner";
import MapPreview from "@/components/ui/map-preview";
import BackButton from "@/components/ui/back-button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  useGetErrandByIdQuery,
  useStartWorkMutation,
  useExtendWorkMutation,
} from "@/store/api/errand";
import { formatErrandType, formatErrandStatus } from "@/utils/errand";
import { STATUS_COLORS } from "@/utils/constants";
import { displayErrorMessage } from "@/utils/errors";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  toggleItem,
  clearProgress,
  parseChecklist,
} from "@/store/slices/checklist";
import { formatTimeRemaining } from "@/utils/time";

const HelperErrandDetails = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const { id } = useLocalSearchParams<{ id: string }>();

  const [startWork, { isLoading: isStarting }] = useStartWorkMutation();
  const [extendWork, { isLoading: isExtending }] = useExtendWorkMutation();
  const [showOvertimeModal, setShowOvertimeModal] = useState(false);
  const [selectedExtension, setSelectedExtension] = useState(1);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const overtimeTriggeredRef = useRef(false);

  const {
    currentData: data,
    isLoading,
    isError,
  } = useGetErrandByIdQuery(id!, {
    refetchOnMountOrArgChange: true,
  });
  const errand = data?.errand;
  const isActive = errand?.status === "IN_PROGRESS";
  const isHandsOn = errand?.type === "HANDS_ON_HELP";
  const workStarted = !!errand?.startedAt;

  const displayAmount = errand?.agreedPrice ?? errand?.suggestedPrice;

  const checklistItems = errand ? parseChecklist(errand.description) : [];
  const checklistProgress = useAppSelector(
    (state) => state.checklist.progress[id!] ?? [],
  );

  const checkedCount = checklistProgress.filter(Boolean).length;
  const allChecked =
    checklistItems.length === 0 || checkedCount === checklistItems.length;
  // Checklist is interactive only once work has begun
  const checklistLocked = isHandsOn ? !workStarted : !isActive;

  const handleMarkComplete = () => {
    if (isHandsOn && !workStarted) {
      Toast.show({
        type: "error",
        text1: "Start work before marking complete",
      });
      return;
    }
    if (!allChecked) {
      Toast.show({
        type: "error",
        text1: "Checklist incomplete",
        text2: `${checklistItems.length - checkedCount} item${checklistItems.length - checkedCount !== 1 ? "s" : ""} still left to tick off`,
      });
      return;
    }
    if (id) dispatch(clearProgress(id));
    router.push(`/helper/upload-proof?errandId=${id}`);
  };

  useEffect(() => {
    if (!isHandsOn || !workStarted || !errand?.startedAt) return;

    overtimeTriggeredRef.current = false;

    const tick = () => {
      const elapsed = Math.floor(
        (Date.now() - new Date(errand.startedAt!).getTime()) / 1000,
      );
      setElapsedSeconds(elapsed);

      const estimatedSecs = (errand.estimatedDuration ?? 0) * 3600;
      if (
        estimatedSecs > 0 &&
        elapsed >= estimatedSecs &&
        !overtimeTriggeredRef.current
      ) {
        overtimeTriggeredRef.current = true;
        setShowOvertimeModal(true);
      }

      // Auto-complete safety net at 2× estimated
      const doubleEstimated = estimatedSecs * 2;
      if (doubleEstimated > 0 && elapsed >= doubleEstimated) {
        handleMarkComplete();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [errand?.startedAt, errand?.estimatedDuration]);

  const handleStartWork = async () => {
    try {
      await startWork(id!).unwrap();
      Toast.show({
        type: "success",
        text1: "Timer started — work begins now!",
      });
    } catch (err) {
      displayErrorMessage(err);
    }
  };

  const handleExtend = async () => {
    try {
      await extendWork({
        errandId: id!,
        additionalHours: selectedExtension,
      }).unwrap();
      overtimeTriggeredRef.current = false;
      setShowOvertimeModal(false);
      Toast.show({
        type: "success",
        text1: `Extended by ${selectedExtension} hour${selectedExtension !== 1 ? "s" : ""}`,
      });
    } catch (err) {
      displayErrorMessage(err);
    }
  };

  const handleNavigate = () => {
    if (!errand?.firstLat || !errand?.firstLng) return;
    const url =
      Platform.OS === "ios"
        ? `maps:?daddr=${errand.firstLat},${errand.firstLng}`
        : `geo:${errand.firstLat},${errand.firstLng}?q=${errand.firstLat},${errand.firstLng}`;
    Linking.openURL(url);
  };

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
          <BackButton onBack={() => router.replace("/helper/home")} />
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
            {errand.firstLat && errand.firstLng ? (
              <MapPreview
                firstLat={errand.firstLat}
                firstLng={errand.firstLng}
                finalLat={errand.finalLat ?? undefined}
                finalLng={errand.finalLng ?? undefined}
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
                  opacity: errand.firstLat ? 1 : 0.4,
                },
              ]}
              onPress={handleNavigate}
              disabled={!errand.firstLat}
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
                <Ionicons
                  name="ellipse"
                  size={10}
                  color={STATUS_COLORS[errand.status]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: STATUS_COLORS[errand.status] },
                  ]}
                >
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
                {isHandsOn ? "/hr" : ""}
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
            {isHandsOn && errand.estimatedDuration && (
              <View style={styles.metaRow}>
                <Ionicons
                  name="hourglass-outline"
                  size={13}
                  color={colors.textSecondary}
                />
                <Text
                  style={[styles.metaText, { color: colors.textSecondary }]}
                >
                  Est. {errand.estimatedDuration} hour
                  {errand.estimatedDuration !== 1 ? "s" : ""}
                </Text>
              </View>
            )}
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
                  style={[styles.chatBtn, { backgroundColor: colors.primary }]}
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
                  <Ionicons name="chatbubble-outline" size={15} color="#fff" />
                  <Text style={styles.chatBtnText}>Message</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Checklist */}
          <View style={styles.section}>
            <View style={styles.checklistHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Checklist
              </Text>
              {checklistItems.length > 0 && (
                <Text
                  style={[
                    styles.checklistCount,
                    {
                      color: allChecked ? colors.success : colors.textTertiary,
                      fontWeight: allChecked ? "700" : "500",
                    },
                  ]}
                >
                  {checkedCount}/{checklistItems.length}
                  {allChecked ? " ✓" : ""}
                </Text>
              )}
            </View>

            {/* Locked notice — only shown when errand is active but work hasn't started yet */}
            {checklistItems.length > 0 && checklistLocked && isActive && (
              <View
                style={[
                  styles.checklistLockBanner,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={14}
                  color={colors.textTertiary}
                />
                <Text
                  style={[styles.checklistLockText, { color: colors.textTertiary }]}
                >
                  {isHandsOn
                    ? "Start work to unlock the checklist"
                    : "Checklist unlocks once the errand is in progress"}
                </Text>
              </View>
            )}

            <View
              style={[
                styles.checklistCard,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                  opacity: checklistLocked ? 0.45 : 1,
                },
              ]}
            >
              {checklistItems.map((item, index) => {
                const checked = !!checklistProgress[index];
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.checkRow,
                      index < checklistItems.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      },
                    ]}
                    onPress={() => {
                      if (checklistLocked) {
                        // Only prompt if there's something the helper can actually do
                        if (isActive) {
                          Toast.show({
                            type: "info",
                            text1: isHandsOn
                              ? "Start work first"
                              : "Errand not started yet",
                            text2: isHandsOn
                              ? "Tap 'Start Work' to begin, then tick off items"
                              : "The checklist will unlock once the errand is active",
                          });
                        }
                        return;
                      }
                      dispatch(
                        toggleItem({
                          errandId: id!,
                          index,
                          total: checklistItems.length,
                        }),
                      );
                    }}
                    activeOpacity={checklistLocked ? 1 : 0.7}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: checked ? colors.primary : colors.border,
                          backgroundColor: checked
                            ? colors.primary
                            : "transparent",
                        },
                      ]}
                    >
                      {checked && (
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.checkText,
                        {
                          color: checked ? colors.textTertiary : colors.text,
                          textDecorationLine: checked ? "line-through" : "none",
                        },
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
                    {isHandsOn ? "Location" : "Pickup"}
                  </Text>
                  <Text style={[styles.locationValue, { color: colors.text }]}>
                    {errand.firstLocation}
                  </Text>
                </View>
              </View>
              {!isHandsOn && (
                <>
                  <View
                    style={[
                      styles.locationLine,
                      { backgroundColor: colors.border },
                    ]}
                  />
                  <View style={styles.locationRow}>
                    <View
                      style={[
                        styles.locationDot,
                        { backgroundColor: colors.cta },
                      ]}
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
                      <Text
                        style={[styles.locationValue, { color: colors.text }]}
                      >
                        {errand.finalLocation}
                      </Text>
                    </View>
                  </View>
                </>
              )}
              {errand.locationReference && (
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
                      Ref: {errand.locationReference}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          

          {/* Actions — when in progress */}
          {isActive && (
            <View style={styles.section}>
              {isHandsOn && !workStarted ? (
                // HANDS_ON_HELP — not started yet
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: colors.primary,
                      opacity: isStarting ? 0.7 : 1,
                    },
                  ]}
                  onPress={handleStartWork}
                  disabled={isStarting}
                >
                  {isStarting ? (
                    <LoadingSpinner size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons
                        name="play-circle-outline"
                        size={18}
                        color="#fff"
                      />
                      <Text style={styles.actionBtnText}>Start Work</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : isHandsOn && workStarted ? (
                // HANDS_ON_HELP — in progress, timer running
                <>
                  <View
                    style={[
                      styles.timerCard,
                      {
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="timer-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.timerLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Time elapsed
                      </Text>
                      <Text style={[styles.timerValue, { color: colors.text }]}>
                        {formatTimeRemaining(elapsedSeconds)}
                      </Text>
                    </View>
                    {errand?.estimatedDuration && (
                      <Text
                        style={[
                          styles.timerEst,
                          { color: colors.textTertiary },
                        ]}
                      >
                        Est. {errand.estimatedDuration}hr
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: allChecked
                          ? colors.success
                          : colors.border,
                      },
                    ]}
                    onPress={handleMarkComplete}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={18}
                      color="#fff"
                    />
                    <Text style={styles.actionBtnText}>
                      {allChecked
                        ? "Mark as Complete"
                        : `${checkedCount}/${checklistItems.length} items checked`}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                // PICKUP_DELIVERY / SHOPPING
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: allChecked
                        ? colors.success
                        : colors.border,
                    },
                  ]}
                  onPress={handleMarkComplete}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.actionBtnText}>
                    {allChecked
                      ? "Mark as Complete"
                      : `${checkedCount}/${checklistItems.length} items checked`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Disputed notice */}
          {errand.status === "DISPUTED" && (
            <View style={styles.section}>
              <View
                style={[
                  styles.noticeCard,
                  {
                    backgroundColor: colors.error + "12",
                    borderColor: colors.error + "50",
                  },
                ]}
              >
                <Ionicons
                  name="warning-outline"
                  size={20}
                  color={colors.error}
                />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[styles.noticeTitle, { color: colors.error }]}>
                    Dispute in progress
                  </Text>
                  <Text
                    style={[styles.noticeBody, { color: colors.textSecondary }]}
                  >
                    The requester has raised a dispute on this errand. Our team
                    is reviewing it and will reach out if needed. Payment is
                    held in escrow until the dispute is resolved.
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showOvertimeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOvertimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name="timer-outline" size={32} color={colors.primary} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Estimated time is up!
            </Text>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              Have you finished or do you need more time?
            </Text>

            <View style={styles.extensionRow}>
              {[0.5, 1, 2, 3].map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[
                    styles.extensionOption,
                    {
                      backgroundColor:
                        selectedExtension === h
                          ? colors.primary
                          : colors.backgroundSecondary,
                      borderColor:
                        selectedExtension === h
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedExtension(h)}
                >
                  <Text
                    style={[
                      styles.extensionText,
                      {
                        color:
                          selectedExtension === h
                            ? "#fff"
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    +{h}hr
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.modalBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: isExtending ? 0.7 : 1,
                },
              ]}
              onPress={handleExtend}
              disabled={isExtending}
            >
              <Text style={styles.modalBtnText}>
                {isExtending
                  ? "Extending..."
                  : `Add ${selectedExtension} hour${selectedExtension !== 1 ? "s" : ""}`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.success }]}
              onPress={() => {
                setShowOvertimeModal(false);
                handleMarkComplete();
              }}
            >
              <Text style={styles.modalBtnText}>{"I'm Done"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  chatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  chatBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  description: { fontSize: 14, lineHeight: 22 },
  checklistHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  checklistCount: { fontSize: 13, fontWeight: "500" },
  checklistLockBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  checklistLockText: { fontSize: 12, flex: 1 },
  checklistCard: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkText: { flex: 1, fontSize: 14, lineHeight: 20 },
  locationBlock: { gap: 4 },
  locationRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  locationDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  locationLine: { width: 2, height: 20, marginLeft: 4, marginVertical: 2 },
  locationLabel: { fontSize: 12, marginBottom: 2 },
  locationValue: { fontSize: 14, fontWeight: "500" },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 10,
  },
  actionBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  noticeTitle: { fontSize: 14, fontWeight: "700" },
  noticeBody: { fontSize: 13, lineHeight: 19 },
  timerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  timerLabel: { fontSize: 12 },
  timerValue: { fontSize: 22, fontWeight: "700" },
  timerEst: { fontSize: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    gap: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  modalSub: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  extensionRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  extensionOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  extensionText: { fontSize: 14, fontWeight: "600" },
  modalBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
