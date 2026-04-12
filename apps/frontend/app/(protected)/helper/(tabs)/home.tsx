import Avatar from "@/components/avatar";
import EmptyState from "@/components/empty-state";
import LoadingSpinner from "@/components/ui/loading-spinner";
import AvailabilityToggle from "@/components/availability-toggle";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppSelector } from "@/store/hooks";
import {
  useGetHelpedErrandsQuery,
  useGetSettingsQuery,
} from "@/store/api/user";
import { useGetPostedErrandsQuery } from "@/store/api/errand";
import { formatErrandType } from "@/utils/errand";
import { useRouter } from "expo-router";
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

const HelperHome = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const [isAvailable, setIsAvailable] = useState(false);
  const user = useAppSelector((state) => state.auth.user) as User;

  const { currentData: activeData, isLoading } = useGetHelpedErrandsQuery(
    { status: ["ACCEPTED", "IN_PROGRESS", "REVIEWING"] },
    { refetchOnMountOrArgChange: true },
  );
  const { currentData: postedData, isLoading: isLoadingPosted } =
    useGetPostedErrandsQuery(undefined, {
      refetchOnMountOrArgChange: true,
    });
  const { currentData: settingsData } = useGetSettingsQuery(null);
  const declinedIds = useAppSelector(
    (state) => state.helper.declinedErrandIds,
  ) as string[];

  useEffect(() => {
    if (settingsData?.settings)
      setIsAvailable(settingsData.settings.isAvailable);
  }, [settingsData, activeData]);

  const postedErrands = (postedData?.errands ?? []).filter(
    (e: any) => !declinedIds.includes(e.id),
  );
  const activeTask = activeData?.errands?.[0] ?? null;
  const hasActiveTask = !!activeTask;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
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

        {/* Availability Toggle */}
        <View style={styles.section}>
          <AvailabilityToggle onValueChange={setIsAvailable} />
        </View>

        {/* Earnings */}
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

        {/* Active Task */}
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

        {/* Available Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Available Tasks
            </Text>
            {postedErrands.length > 0 && !hasActiveTask && isAvailable && (
              <TouchableOpacity
                onPress={() => router.push("/helper/browse-errands")}
              >
                <Text style={[styles.viewAll, { color: colors.primary }]}>
                  View all
                </Text>
              </TouchableOpacity>
            )}
          </View>

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
                Toggle availability on to see and receive nearby tasks
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
                Complete your current task to pick up a new one
              </Text>
            </View>
          ) : isLoadingPosted ? (
            <EmptyState
              variant="card"
              icon="hourglass-outline"
              message="Looking for tasks..."
            />
          ) : postedErrands.length === 0 ? (
            <EmptyState
              variant="card"
              icon="map-outline"
              message="No tasks available right now"
            />
          ) : (
            postedErrands.slice(0, 3).map((errand: any) => (
              <TouchableOpacity
                key={errand.id}
                style={[
                  styles.taskCard,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() =>
                  router.push(`/helper/task-details?id=${errand.id}`)
                }
                activeOpacity={0.8}
              >
                <View style={styles.taskCardHeader}>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: colors.primary + "20" },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: colors.primary }]}>
                      {formatErrandType(errand.type)}
                    </Text>
                  </View>
                  <Text
                    style={[styles.activeTaskPrice, { color: colors.primary }]}
                  >
                    £
                    {(errand.agreedPrice ?? errand.suggestedPrice ?? 0).toFixed(
                      2,
                    )}
                  </Text>
                </View>
                <Text
                  style={[styles.activeTaskTitle, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {errand.title}
                </Text>
                <View style={styles.locationRow}>
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.locationText,
                      { color: colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {errand.pickupLocation}
                  </Text>
                </View>
                <View
                  style={[styles.divider, { backgroundColor: colors.border }]}
                />
                <View style={styles.taskCardFooter}>
                  <View style={styles.requesterRow}>
                    <Avatar
                      firstName={errand.requester?.firstName ?? ""}
                      lastName={errand.requester?.lastName ?? ""}
                      size={24}
                    />
                    <Text
                      style={[
                        styles.requesterName,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {errand.requester?.firstName} {errand.requester?.lastName}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.locationText,
                      { color: colors.textTertiary },
                    ]}
                  >
                    {new Date(errand.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
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
  availabilityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  availabilityTitle: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  availabilitySubtitle: { fontSize: 12 },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
    paddingBottom: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 16, fontWeight: "600" },
  viewAll: { fontSize: 14, fontWeight: "600" },
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
  emptyTaskText: { fontSize: 13 },
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
  taskCard: { padding: 14, borderRadius: 10, borderWidth: 1, gap: 8 },
  taskCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  divider: { height: 1 },
  requesterRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  requesterName: { fontSize: 12 },
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
});
