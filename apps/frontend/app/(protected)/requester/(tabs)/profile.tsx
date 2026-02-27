import Avatar from "@/components/avatar";
import ExpandableSection from "@/components/ui/expandable-section";
import Input from "@/components/ui/input";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Section = null | "editProfile" | "paymentMethods" | "notifications";

const Profile = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const [expanded, setExpanded] = useState<Section>(null);

  const toggle = (section: Section) => {
    setExpanded((prev) => (prev === section ? null : section));
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar + Name */}
        <View style={styles.hero}>
          <Avatar firstName="Alex" lastName="Johnson" size={80} />
          <Text style={[styles.name, { color: colors.text }]}>
            Alex Johnson
          </Text>
          <Text style={[styles.university, { color: colors.primary }]}>
            Stanford University
          </Text>
          <Text style={[styles.member, { color: colors.textTertiary }]}>
            Member since 2023
          </Text>
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
              value=""
              onChangeText={() => {}}
              onBlur={() => {}}
            />
            <Input
              label="Last Name"
              placeholder="Last name"
              value=""
              onChangeText={() => {}}
              onBlur={() => {}}
            />
            <Input
              label="Phone Number"
              placeholder="Phone number"
              value=""
              onChangeText={() => {}}
              onBlur={() => {}}
            />
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
        </View>

        {/* Log Out */}
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: colors.border }]}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>
            Log Out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24, gap: 20 },
  hero: { alignItems: "center", gap: 6, paddingVertical: 16 },
  name: { fontSize: 22, fontWeight: "700" },
  university: { fontSize: 15, fontWeight: "500" },
  member: { fontSize: 13 },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  settings: { gap: 10 },
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
