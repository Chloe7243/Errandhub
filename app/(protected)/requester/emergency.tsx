import BackButton from "@/components/ui/back-button";
import Input from "@/components/ui/input";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Emergency = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const [report, setReport] = useState("");

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={{ flex: 1, gap: 24 }}>
          <BackButton />
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.pageTitle, { color: colors.text }]}>
              Emergency Assistance
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={[styles.content]}
            showsVerticalScrollIndicator={false}
          >
            {/* Warning Banner */}
            <View style={[styles.warningBanner, { borderColor: colors.error }]}>
              <Ionicons name="shield-outline" size={20} color={colors.error} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.warningTitle, { color: colors.error }]}>
                  Are you feeling unsafe?
                </Text>
                <Text
                  style={[
                    styles.warningSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Your safety is our priority. Choose an action below.
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.error }]}
              >
                <Ionicons name="shield-outline" size={18} color={colors.text} />
                <Text
                  style={[
                    { color: colors.text, fontSize: 15, fontWeight: "600" },
                  ]}
                >
                  Alert Admin Immediately
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}
              >
                <Ionicons
                  name="share-social-outline"
                  size={18}
                  color={colors.text}
                />
                <Text
                  style={[
                    { color: colors.text, fontSize: 15, fontWeight: "600" },
                  ]}
                >
                  Share Live Location
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}
              >
                <Ionicons name="call-outline" size={18} color={colors.text} />
                <Text
                  style={[
                    { color: colors.text, fontSize: 15, fontWeight: "600" },
                  ]}
                >
                  Call Campus Security
                </Text>
              </TouchableOpacity>
            </View>

            {/* Report */}
            <View style={styles.reportSection}>
              <Input
                multiline={true}
                label="What's wrong? (Optional)"
                placeholder="Describe the situation..."
                value={report}
                onChangeText={setReport}
                onBlur={() => {}}
                wrapperStyle={{ alignItems: "flex-start" }}
                inputStyle={{ minHeight: 200 }}
              />

              <TouchableOpacity
                style={[styles.sendButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.sendText}>Send Report</Text>
                <Ionicons name="send-outline" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Emergency;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  content: {
    flex: 1,
    gap: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  pageTitle: { fontSize: 20, fontWeight: "700" },
  warningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  warningTitle: { fontSize: 14, fontWeight: "700" },
  warningSubtitle: { fontSize: 13, marginTop: 2 },
  actions: { gap: 12 },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
  },
  reportSection: { gap: 12 },
  inputLabel: { fontSize: 13 },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  sendText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
