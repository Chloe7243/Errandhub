import AvailabilityToggle from "@/components/availability-toggle";
import Avatar from "@/components/avatar";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { RootState } from "@/store";
import {
  useGetHelpedErrandsQuery,
  useGetSettingsQuery,
} from "@/store/api/user";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setPermissionStatus, setCoordinates } from "@/store/slices/location";
import { User } from "@/types";
import { formatErrandType } from "@/utils/errand";
import { getSocket } from "@/utils/socket";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { activeStatuses } from "@errandhub/shared";
import * as Location from "expo-location";

const HelperHome = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const dispatch = useAppDispatch();
  const user = useAppSelector((state: RootState) => state.auth.user) as User;
  const locationPermission = useAppSelector(
    (state: RootState) => state.location.permissionStatus,
  );

  const { currentData: activeData, isLoading } = useGetHelpedErrandsQuery(
    { status: activeStatuses },
    { refetchOnMountOrArgChange: true },
  );
  const { currentData: completedData } = useGetHelpedErrandsQuery(
    { status: ["COMPLETED"] },
    { refetchOnMountOrArgChange: true },
  );
  const { currentData: settingsData } = useGetSettingsQuery(null);

  useEffect(() => {}, []);

  useEffect(() => {
    (async function getCurrentLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      dispatch(
        setPermissionStatus(status === "granted" ? "granted" : "denied"),
      );
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({});
      dispatch(
        setCoordinates({ lat: loc.coords.latitude, lng: loc.coords.longitude }),
      );

      const socket = getSocket();
      socket?.emit("update_location", {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      });
    })();
  }, []);

  const completedErrands = completedData?.errands ?? [];

  const todayEarnings = completedErrands
    .filter((e: any) => {
      if (!e.completedAt) return false;
      const d = new Date(e.completedAt);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    })
    .reduce((sum: number, e: any) => sum + e.finalCost, 0);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekEarnings = completedErrands
    .filter((e: any) => e.completedAt && new Date(e.completedAt) >= weekStart)
    .reduce((sum: number, e: any) => sum + e.finalCost, 0);

  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    if (settingsData?.settings) {
      setIsAvailable(settingsData.settings.isAvailable);
    }
  }, [settingsData]);

  const activeTask = activeData?.errands?.[0] ?? null;
  const hasActiveTask = !!activeTask;

  if (locationPermission === "denied") {
    return (
      <SafeAreaView
        style={[
          styles.container,
          styles.blockedContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <MaterialIcons
          name="location-off"
          size={56}
          color={colors.textTertiary}
        />
        <Text style={[styles.blockedTitle, { color: colors.text }]}>
          Location Required
        </Text>
        <Text style={[styles.blockedBody, { color: colors.textSecondary }]}>
          {
            "ErrandHub needs your location to match you with nearby errands. Without it you won't appear in any requester's search."
          }
        </Text>
        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: colors.primary }]}
          onPress={() => Linking.openSettings()}
        >
          <Text style={styles.settingsButtonText}>Open Settings</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

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
              uri={user?.avatarUrl ?? undefined}
              size={50}
            />
            <View>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                {(() => {
                  const h = new Date().getHours();
                  if (h < 12) return "Good morning,";
                  if (h < 18) return "Good afternoon,";
                  return "Good evening,";
                })()}
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
              {
                label: "Today",
                value: `£${todayEarnings.toFixed(2)}`,
                icon: "trending-up-outline",
              },
              {
                label: "This Week",
                value: `£${weekEarnings.toFixed(2)}`,
                icon: "wallet-outline",
              },
              {
                label: "Completed",
                value: String(completedErrands.length),
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
                  {activeTask.firstLocation}
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
    </SafeAreaView>
  );
};

export default HelperHome;

const styles = StyleSheet.create({
  container: { flex: 1 },
  blockedContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
    gap: 16,
  },
  blockedTitle: { fontSize: 22, fontWeight: "700", textAlign: "center" },
  blockedBody: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  settingsButton: {
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  settingsButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
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
});
