import Avatar from "@/components/avatar";
import ExpandableSection from "@/components/ui/expandable-section";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Bell, ChevronRight, LogOut, MapPin, Save } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type RadiusOption = 0.5 | 1 | 2 | 5;

const RADIUS_OPTIONS: RadiusOption[] = [0.5, 1, 2, 5];

const HelperSettings = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [selectedRadius, setSelectedRadius] = useState<RadiusOption>(0.5);

  const handleSave = (): void => {
    // persist settings
    console.log("Saving settings", { isAvailable, selectedRadius });
  };

  const handleLogout = (): void => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => console.log("Logging out"),
      },
    ]);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              borderBottomColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}
        >
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
            <Avatar firstName="Alex" lastName="Helper" size={56} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                Alex Helper
              </Text>
              <View style={styles.profileMeta}>
                <Text
                  style={[
                    styles.profileRating,
                    { color: colors.textSecondary },
                  ]}
                >
                  ⭐ 4.8
                </Text>
                <Text
                  style={[styles.profileDot, { color: colors.textTertiary }]}
                >
                  ·
                </Text>
                <Text
                  style={[
                    styles.profileEarnings,
                    { color: colors.textSecondary },
                  ]}
                >
                  Total earned:{" "}
                  <Text
                    style={[styles.earningsValue, { color: colors.success }]}
                  >
                    £127.50
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Availability */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Availability
          </Text>
          <View
            style={[
              styles.settingRow,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.settingRowLeft}>
              <View
                style={[
                  styles.settingIconWrapper,
                  { backgroundColor: colors.success + "15" },
                ]}
              >
                <Bell size={16} color={colors.success} />
              </View>
              <View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Available for tasks
                </Text>
                <Text
                  style={[
                    styles.settingSubLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  {isAvailable
                    ? "You are visible to requesters"
                    : "You are hidden from requesters"}
                </Text>
              </View>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={setIsAvailable}
              trackColor={{ false: colors.border, true: colors.success }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Notification Radius */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Notification Radius
          </Text>
          <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
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
                      selectedRadius === radius
                        ? colors.primary
                        : colors.backgroundSecondary,
                    borderColor:
                      selectedRadius === radius
                        ? colors.primary
                        : colors.border,
                  },
                ]}
                onPress={() => setSelectedRadius(radius)}
                activeOpacity={0.7}
              >
                <MapPin
                  size={12}
                  color={
                    selectedRadius === radius ? "#fff" : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.radiusText,
                    {
                      color:
                        selectedRadius === radius
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

        {/* Payment Methods */}
        <ExpandableSection
          icon="card-outline"
          label="Payment Methods"
          expanded={isExpanded}
          containerStyle={{ paddingHorizontal: 14, paddingTop: 18 }}
          onPress={() => setIsExpanded((prev) => !prev)}
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
              name="card-outline"
              size={20}
              color={colors.textSecondary}
            />
            <Text style={[styles.cardText, { color: colors.text }]}>
              •••• •••• •••• 4242
            </Text>
            <Text style={[styles.cardBadge, { color: colors.primary }]}>
              Default
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
          >
            <Ionicons name="add" size={18} color={colors.text} />
            <Text style={[styles.saveText, { color: colors.text }]}>
              Add Payment Method
            </Text>
          </TouchableOpacity>
        </ExpandableSection>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Account
          </Text>

          <TouchableOpacity
            style={[
              styles.actionRow,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              },
            ]}
            activeOpacity={0.7}
            onPress={handleLogout}
          >
            <View style={styles.settingRowLeft}>
              <View
                style={[
                  styles.settingIconWrapper,
                  { backgroundColor: colors.error + "15" },
                ]}
              >
                <LogOut size={16} color={colors.error} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.error }]}>
                Log Out
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <View style={styles.saveSection}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
            onPress={handleSave}
          >
            <Save size={18} color="#fff" />
            <Text style={styles.saveBtnText}>Save Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HelperSettings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  sectionSub: {
    fontSize: 13,
    marginTop: -4,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  profileMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  profileRating: {
    fontSize: 13,
  },
  profileDot: {
    fontSize: 13,
  },
  profileEarnings: {
    fontSize: 13,
  },
  earningsValue: {
    fontWeight: "600",
  },
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
  settingIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  panel: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    marginTop: -4,
  },
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
  notifRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  settingSubLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  radiusRow: {
    flexDirection: "row",
    gap: 10,
  },
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
  radiusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  saveSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
