import Avatar from "@/components/avatar";
import ExpandableSection from "@/components/ui/expandable-section";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  useGetHelpedErrandsQuery,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useUpdateAvatarMutation,
} from "@/store/api/user";
import * as ImagePicker from "expo-image-picker";
import { logoutUser, updateUserState } from "@/store/slices";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { useThemePreference } from "@/hooks/use-theme-preference";
import { ThemePreference } from "@/store/slices/theme";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { displayErrorMessage } from "@/utils/errors";
import { User } from "@/types";
import AvailabilityToggle from "@/components/availability-toggle";
import SwitchRole from "@/components/switch-role";
import { activeStatuses } from "@errandhub/shared";

type RadiusOption = 0.5 | 1 | 2 | 5;
const RADIUS_OPTIONS: RadiusOption[] = [0.5, 1, 2, 5];

type Settings = {
  isAvailable: boolean;
  notificationRadius: RadiusOption;
  errandUpdates: boolean;
  newMessages: boolean;
  promotions: boolean;
};

const DEFAULT_SETTINGS: Settings = {
  isAvailable: false,
  notificationRadius: 2,
  errandUpdates: true,
  newMessages: true,
  promotions: false,
};

const HelperSettings = () => {
  const dispatch = useAppDispatch();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const user = useAppSelector((state) => state.auth.user) as User;

  const [isPaymentExpanded, setIsPaymentExpanded] = useState(false);
  const [isNotifExpanded, setIsNotifExpanded] = useState(false);
  const { preference: themePreference, changeTheme } = useThemePreference();

  const THEME_OPTIONS: {
    value: ThemePreference;
    label: string;
    icon: string;
  }[] = [
    { value: "light", label: "Light", icon: "sunny-outline" },
    { value: "dark", label: "Dark", icon: "moon-outline" },
    { value: "system", label: "System", icon: "phone-portrait-outline" },
  ];
  const [savedSettings, setSavedSettings] =
    useState<Settings>(DEFAULT_SETTINGS);
  const [currentSettings, setCurrentSettings] =
    useState<Settings>(DEFAULT_SETTINGS);

  const [updateAvatar, { isLoading: isUploadingAvatar }] =
    useUpdateAvatarMutation();

  const handleAvatarPress = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Toast.show({ type: "error", text1: "Camera roll permission required" });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      shape: "oval",
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    const localUri = result.assets[0].uri;
    try {
      const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
      const uploadPreset =
        process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";
      const filename = localUri.split("/").pop() ?? "avatar.jpg";
      const type = filename.endsWith(".png") ? "image/png" : "image/jpeg";
      const formData = new FormData();
      formData.append("file", { uri: localUri, name: filename, type } as any);
      formData.append("upload_preset", uploadPreset);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData },
      );
      if (!res.ok) throw new Error("Upload failed");
      const { secure_url } = await res.json();

      await updateAvatar(secure_url).unwrap();
      dispatch(updateUserState({ avatarUrl: secure_url }));
      Toast.show({ type: "success", text1: "Avatar updated" });
    } catch {
      Toast.show({ type: "error", text1: "Failed to update avatar" });
    }
  };

  const { currentData: settingsData, isLoading } = useGetSettingsQuery(null);
  const [updateSettings, { isLoading: isSaving }] = useUpdateSettingsMutation();
  const { data: activeErrandsData } = useGetHelpedErrandsQuery({
    status: activeStatuses,
  });

  useEffect(() => {
    if (settingsData?.settings) {
      const loaded: Settings = {
        isAvailable: settingsData.settings.isAvailable,
        notificationRadius: settingsData.settings
          .notificationRadius as RadiusOption,
        errandUpdates: settingsData.settings.errandUpdates,
        newMessages: settingsData.settings.newMessages,
        promotions: settingsData.settings.promotions,
      };
      setSavedSettings(loaded);
      setCurrentSettings(loaded);
    }
  }, [settingsData]);

  const hasChanges =
    JSON.stringify(savedSettings) !== JSON.stringify(currentSettings);

  const updateSetting = <K extends keyof Settings>(
    key: K,
    value: Settings[K],
  ) => {
    setCurrentSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      await updateSettings(currentSettings).unwrap();
      setSavedSettings(currentSettings);
      Toast.show({ type: "success", text1: "Settings saved" });
    } catch (err) {
      displayErrorMessage(err);
    }
  };

  const handleLogout = () => {
    const activeCount = activeErrandsData?.errands?.length ?? 0;
    const message =
      activeCount > 0
        ? `You have ${activeCount} active errand${activeCount > 1 ? "s" : ""} in progress. They may be cancelled if you log out.`
        : "Are you sure you want to log out?";

    Alert.alert("Log Out", message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => dispatch(logoutUser()),
      },
    ]);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: hasChanges ? 100 : 40 }}
          >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Settings
              </Text>
            </View>

            {/* Profile Card */}
            <View style={styles.section}>
              <View
                style={[
                  styles.profileCard,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={handleAvatarPress}
                  disabled={isUploadingAvatar}
                  style={{ position: "relative" }}
                >
                  <Avatar
                    firstName={user?.firstName ?? ""}
                    lastName={user?.lastName ?? ""}
                    uri={user?.avatarUrl ?? undefined}
                    size={56}
                  />
                  <View
                    style={[
                      styles.avatarEditBadge,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    {isUploadingAvatar ? (
                      <LoadingSpinner customSize={0.7} color="#fff" />
                    ) : (
                      <Ionicons name="camera-outline" size={11} color="#fff" />
                    )}
                  </View>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.profileName, { color: colors.text }]}>
                    {user?.firstName} {user?.lastName}
                  </Text>
                  <Text
                    style={[
                      styles.profileEmail,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {user?.email}
                  </Text>
                </View>
              </View>
            </View>

            {/* Availability */}
            <View style={styles.section}>
              <AvailabilityToggle
                controlled
                value={currentSettings.isAvailable}
                onChange={(val) => updateSetting("isAvailable", val)}
              />
            </View>

            {/* Notification Radius */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Notification Radius
              </Text>
              <Text
                style={[styles.sectionSub, { color: colors.textSecondary }]}
              >
                Only receive tasks within this distance from you
              </Text>
              <View style={styles.radiusRow}>
                {RADIUS_OPTIONS.map((radius) => (
                  <TouchableOpacity
                    key={radius}
                    style={[
                      styles.radiusOption,
                      {
                        backgroundColor:
                          currentSettings.notificationRadius === radius
                            ? colors.primary
                            : colors.backgroundSecondary,
                        borderColor:
                          currentSettings.notificationRadius === radius
                            ? colors.primary
                            : colors.border,
                      },
                    ]}
                    onPress={() => updateSetting("notificationRadius", radius)}
                  >
                    <Ionicons
                      name="location-outline"
                      size={12}
                      color={
                        currentSettings.notificationRadius === radius
                          ? "#fff"
                          : colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.radiusText,
                        {
                          color:
                            currentSettings.notificationRadius === radius
                              ? "#fff"
                              : colors.textSecondary,
                        },
                      ]}
                    >
                      {radius}km
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Appearance */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Appearance
              </Text>
              <Text
                style={[styles.sectionSub, { color: colors.textSecondary }]}
              >
                Choose your preferred theme
              </Text>
              <View style={styles.radiusRow}>
                {THEME_OPTIONS.map((opt) => {
                  const active = themePreference === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.radiusOption,
                        {
                          backgroundColor: active
                            ? colors.primary
                            : colors.backgroundSecondary,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => changeTheme(opt.value)}
                    >
                      <Ionicons
                        name={opt.icon as any}
                        size={14}
                        color={active ? "#fff" : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.radiusText,
                          { color: active ? "#fff" : colors.textSecondary },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Notifications */}
            <ExpandableSection
              icon="notifications-outline"
              label="Notifications"
              expanded={isNotifExpanded}
              containerStyle={{ paddingHorizontal: 14, paddingTop: 18 }}
              onPress={() => setIsNotifExpanded((prev) => !prev)}
            >
              {[
                {
                  key: "errandUpdates",
                  label: "Errand updates",
                  sub: "Get notified on errand status changes",
                },
                {
                  key: "newMessages",
                  label: "New messages",
                  sub: "Get notified when you receive a message",
                },
                {
                  key: "promotions",
                  label: "Promotions",
                  sub: "Offers and platform updates",
                },
              ].map((item) => (
                <View
                  key={item.key}
                  style={[
                    styles.settingRow,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.settingRowLeft}>
                    <View>
                      <Text
                        style={[styles.settingLabel, { color: colors.text }]}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={[
                          styles.settingSubLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {item.sub}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={
                      currentSettings[item.key as keyof Settings] as boolean
                    }
                    onValueChange={(val) =>
                      updateSetting(item.key as keyof Settings, val)
                    }
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#fff"
                  />
                </View>
              ))}
            </ExpandableSection>

            {/* Bank Details */}
            <ExpandableSection
              icon="business-outline"
              label="Bank Details"
              expanded={isPaymentExpanded}
              containerStyle={{ paddingHorizontal: 14, paddingTop: 18 }}
              onPress={() => setIsPaymentExpanded((prev) => !prev)}
            >
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text
                  style={[
                    styles.cardText,
                    { color: colors.textSecondary, fontSize: 13 },
                  ]}
                >
                  Bank details are collected securely when you receive your
                  first payout via Stripe.
                </Text>
              </View>
            </ExpandableSection>

            {/* Account */}
            <View style={styles.section}>
              <SwitchRole />
              <TouchableOpacity
                style={[
                  styles.settingRow,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                  },
                ]}
                onPress={handleLogout}
              >
                <View style={styles.settingRowLeft}>
                  <View
                    style={[
                      styles.iconWrapper,
                      { backgroundColor: colors.error + "15" },
                    ]}
                  >
                    <Ionicons
                      name="log-out-outline"
                      size={16}
                      color={colors.error}
                    />
                  </View>
                  <Text style={[styles.settingLabel, { color: colors.error }]}>
                    Log Out
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            </View>
          </ScrollView>
          {/* Sticky Save Button — only when changes exist */}
          {hasChanges && (
            <View
              style={[
                styles.stickyBar,
                {
                  backgroundColor: colors.background,
                  borderTopColor: colors.border,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity: isSaving ? 0.7 : 1,
                  },
                ]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <LoadingSpinner customSize={1.5} color="#fff" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={18} color="#fff" />
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
};

export default HelperSettings;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  section: { paddingHorizontal: 16, paddingTop: 20, gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "600" },
  sectionSub: { fontSize: 13, marginTop: -4 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileName: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  profileEmail: { fontSize: 13 },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  settingRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: { fontSize: 14, fontWeight: "500" },
  settingSubLabel: { fontSize: 12, marginTop: 2 },
  radiusRow: { flexDirection: "row", gap: 10 },
  radiusOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  radiusText: { fontSize: 13, fontWeight: "600" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  cardText: { flex: 1, fontSize: 14 },
  cardBadge: { fontSize: 12, fontWeight: "600" },
  addButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
  },
  addButtonText: { fontWeight: "600", fontSize: 14 },
  stickyBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
