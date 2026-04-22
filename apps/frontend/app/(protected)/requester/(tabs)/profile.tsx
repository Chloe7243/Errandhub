import Avatar from "@/components/avatar";
import EmptyState from "@/components/empty-state";
import SwitchRole from "@/components/switch-role";
import ExpandableSection from "@/components/ui/expandable-section";
import Input from "@/components/ui/input";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemePreference } from "@/hooks/use-theme-preference";
import {
  useGetUserDetailsQuery,
  useUpdateAvatarMutation,
  useGetRequestedErrandsQuery,
} from "@/store/api/user";
import {
  useGetPaymentMethodsQuery,
  useDeletePaymentMethodMutation,
} from "@/store/api/payment";
import * as ImagePicker from "expo-image-picker";
import { useAppDispatch } from "@/store/hooks";
import { logoutUser, updateUserState } from "@/store/slices";
import { ThemePreference } from "@/store/slices/theme";
import { activeStatuses } from "@errandhub/shared";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { displayErrorMessage } from "@/utils/errors";
import AddPaymentMethodButton from "@/components/add-payment-method";

type Section =
  | null
  | "editProfile"
  | "paymentMethods"
  | "notifications"
  | "appearance";

const Profile = () => {
  const dispatch = useAppDispatch();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const [expanded, setExpanded] = useState<Section>(null);
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

  const {
    currentData: data,
    isLoading,
    isError,
  } = useGetUserDetailsQuery(null);

  const { data: activeErrandsData } = useGetRequestedErrandsQuery({
    status: activeStatuses,
  });

  const [updateAvatar, { isLoading: isUploadingAvatar }] =
    useUpdateAvatarMutation();

  const handleAvatarPress = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Toast.show({ type: "error", text1: "Camera roll permission required" });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
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

  const { data: methodsData } = useGetPaymentMethodsQuery();
  const [deletePaymentMethod] = useDeletePaymentMethodMutation();

  const savedCards = methodsData?.paymentMethods ?? [];

  const handleDeleteCard = (cardId: string, last4: string) => {
    Alert.alert("Remove Card", `Remove card ending in ${last4}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePaymentMethod(cardId).unwrap();
            Toast.show({ type: "success", text1: "Card removed" });
          } catch (err) {
            displayErrorMessage(err);
          }
        },
      },
    ]);
  };

  const user = data?.user;

  const toggle = (section: Section) => {
    setExpanded((prev) => (prev === section ? null : section));
  };

  const handleLogout = (): void => {
    const activeCount = activeErrandsData?.errands?.length ?? 0;
    const message =
      activeCount > 0
        ? `You have ${activeCount} active errand${activeCount > 1 ? "s" : ""} in progress. They may expire or be cancelled if you log out.`
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
      ) : isError || !user ? (
        <EmptyState
          containerStyle={{ marginHorizontal: 14 }}
          fullScreen
          isError
          message="Failed to load profile"
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Avatar + Name */}
          <View style={styles.hero}>
            <TouchableOpacity
              onPress={handleAvatarPress}
              disabled={isUploadingAvatar}
              style={styles.avatarWrapper}
            >
              <Avatar
                firstName={user.firstName}
                lastName={user.lastName}
                uri={user.avatarUrl ?? undefined}
                size={80}
              />
              <View
                style={[
                  styles.avatarEditBadge,
                  { backgroundColor: colors.primary },
                ]}
              >
                {isUploadingAvatar ? (
                  <LoadingSpinner customSize={0.8} color="#fff" />
                ) : (
                  <Ionicons name="camera-outline" size={13} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
            <Text style={[styles.name, { color: colors.text }]}>
              {user.firstName} {user.lastName}
            </Text>
            {user.university && (
              <Text style={[styles.university, { color: colors.primary }]}>
                {user.university}
              </Text>
            )}
            <Text style={[styles.member, { color: colors.textTertiary }]}>
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </Text>
            {user.isVerified && (
              <View style={styles.verifiedRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.success}
                />
                <Text style={[styles.verifiedText, { color: colors.success }]}>
                  Verified
                </Text>
              </View>
            )}
          </View>

          {/* Settings */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Settings
          </Text>

          <View style={styles.settings}>
            {/* Edit Profile */}
            <ExpandableSection
              icon="person-outline"
              label="Edit Profile"
              expanded={expanded === "editProfile"}
              onPress={() => toggle("editProfile")}
            >
              <Input
                label="First Name"
                placeholder="First name"
                value={user.firstName}
                onChangeText={() => {}}
                onBlur={() => {}}
              />
              <Input
                label="Last Name"
                placeholder="Last name"
                value={user.lastName}
                onChangeText={() => {}}
                onBlur={() => {}}
              />
              <Input
                label="Phone Number"
                placeholder="Phone number"
                value={user.phone}
                onChangeText={() => {}}
                onBlur={() => {}}
                keyboardType="phone-pad"
              />
              {user.university && (
                <Input
                  label="University"
                  placeholder="University"
                  value={user.university}
                  onChangeText={() => {}}
                  onBlur={() => {}}
                />
              )}
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.saveText}>Save Changes</Text>
              </TouchableOpacity>
            </ExpandableSection>

            {/* Payment Methods */}
            <ExpandableSection
              icon="card-outline"
              label="Payment Methods"
              expanded={expanded === "paymentMethods"}
              onPress={() => toggle("paymentMethods")}
            >
              {savedCards.length === 0 && (
                <View style={styles.emptyCards}>
                  <Ionicons
                    name="card-outline"
                    size={26}
                    color={colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.emptyCardsText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    No saved cards yet.
                  </Text>
                </View>
              )}
              {savedCards.map((card) => (
                <View
                  key={card.id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="card-outline"
                    size={20}
                    color={colors.textSecondary}
                  />
                  <Text style={[styles.cardText, { color: colors.text }]}>
                    {card.card.brand.charAt(0).toUpperCase() +
                      card.card.brand.slice(1)}{" "}
                    •••• {card.card.last4}
                  </Text>
                  <Text
                    style={[styles.cardExpiry, { color: colors.textSecondary }]}
                  >
                    {card.card.exp_month}/{card.card.exp_year}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteCard(card.id, card.card.last4)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                </View>
              ))}
              <AddPaymentMethodButton />
            </ExpandableSection>
            {/* Notifications */}
            <ExpandableSection
              icon="notifications-outline"
              label="Notifications"
              expanded={expanded === "notifications"}
              onPress={() => toggle("notifications")}
            >
              {["Errand updates", "New messages"].map((item) => (
                <View key={item} style={styles.notifRow}>
                  <Text style={[styles.notifLabel, { color: colors.text }]}>
                    {item}
                  </Text>
                  <TouchableOpacity
                    style={[styles.toggle, { backgroundColor: colors.primary }]}
                  >
                    <View style={styles.toggleDot} />
                  </TouchableOpacity>
                </View>
              ))}
            </ExpandableSection>

            {/* Appearance */}
            <ExpandableSection
              icon="contrast-outline"
              label="Appearance"
              expanded={expanded === "appearance"}
              onPress={() => toggle("appearance")}
            >
              <View style={styles.themeRow}>
                {THEME_OPTIONS.map((opt) => {
                  const active = themePreference === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.themeOption,
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
                        size={16}
                        color={active ? "#fff" : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.themeLabel,
                          { color: active ? "#fff" : colors.textSecondary },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ExpandableSection>
          </View>

          <View style={[styles.actions]}>
            <SwitchRole />
            <TouchableOpacity
              style={[styles.logoutButton, { borderColor: colors.border }]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
              <Text style={[styles.logoutText, { color: colors.error }]}>
                Log Out
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24, gap: 20 },
  hero: { alignItems: "center", gap: 6, paddingVertical: 16 },
  avatarWrapper: { position: "relative" },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  name: { fontSize: 22, fontWeight: "700" },
  university: { fontSize: 15, fontWeight: "500" },
  member: { fontSize: 13 },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  verifiedText: { fontSize: 13, fontWeight: "500" },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  settings: { gap: 10 },
  saveButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  saveText: { color: "#fff", fontWeight: "600", fontSize: 14 },
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
  cardExpiry: { fontSize: 12 },
  emptyCards: { alignItems: "center", gap: 8, paddingVertical: 12 },
  emptyCardsText: { fontSize: 13, textAlign: "center", lineHeight: 18 },
  notifRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notifLabel: { fontSize: 14 },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignSelf: "flex-end",
  },
  themeRow: { flexDirection: "row", gap: 10 },
  themeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  themeLabel: { fontSize: 13, fontWeight: "600" },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  logoutText: { fontSize: 15, fontWeight: "600" },
});
