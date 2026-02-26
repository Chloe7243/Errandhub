import Avatar from "@/components/avatar";
import BackButton from "@/components/ui/back-button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MOCK_COMPLETION = {
  proofImage: null, // swap with real image URI
  helper: {
    firstName: "Mike",
    lastName: "T",
    avatar: null,
  },
  note: "Laundry dropped off at door 3b. All items accounted for!",
  time: "2 mins ago",
  checks: ["Items delivered", "No substitutions needed", "Delivered on time"],
};

const ReviewCompletion = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const router = useRouter();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <BackButton />
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>
            Review Completion
          </Text>
        </View>

        {/* Proof Image */}
        <View
          style={[
            styles.imageContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {MOCK_COMPLETION.proofImage ? (
            <Image
              source={{ uri: MOCK_COMPLETION.proofImage }}
              style={styles.proofImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons
                name="image-outline"
                size={32}
                color={colors.textTertiary}
              />
              <Text
                style={[
                  styles.imagePlaceholderText,
                  { color: colors.textTertiary },
                ]}
              >
                Delivery Proof
              </Text>
            </View>
          )}
          <View
            style={[styles.imageBadge, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.imageBadgeText, { color: colors.text }]}>
              Proof of Delivery
            </Text>
          </View>
        </View>

        {/* Helper Note */}
        <View
          style={[
            styles.noteCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Avatar
            firstName={MOCK_COMPLETION.helper.firstName}
            lastName={MOCK_COMPLETION.helper.lastName}
            size={44}
          />
          <View style={styles.noteContent}>
            <View
              style={[
                styles.noteBubble,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              <Text style={[styles.noteText, { color: colors.text }]}>
                {MOCK_COMPLETION.note}
              </Text>
            </View>
            <Text style={[styles.noteMeta, { color: colors.textTertiary }]}>
              {MOCK_COMPLETION.helper.firstName}{" "}
              {MOCK_COMPLETION.helper.lastName} • {MOCK_COMPLETION.time}
            </Text>
          </View>
        </View>

        {/* Task Verification */}
        <View
          style={[
            styles.verificationCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.verificationTitle, { color: colors.text }]}>
            Task Verification
          </Text>
          {MOCK_COMPLETION.checks.map((check, index) => (
            <View
              key={check}
              style={[
                styles.checkRow,
                index < MOCK_COMPLETION.checks.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.checkText, { color: colors.textSecondary }]}>
                {check}
              </Text>
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={colors.success}
              />
            </View>
          ))}
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={[styles.confirmButton, { backgroundColor: colors.success }]}
          onPress={() => router.push("/requester/errands")}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          <Text style={styles.confirmText}>Confirm & Release Payment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.disputeButton}
          onPress={() => router.push("/requester/raise-dispute")}
        >
          <Ionicons
            name="warning-outline"
            size={16}
            color={colors.textSecondary}
          />
          <Text style={[styles.disputeText, { color: colors.error }]}>
            Raise Dispute
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReviewCompletion;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, gap: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  imageContainer: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    height: 220,
  },
  proofImage: { width: "100%", height: "100%" },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  imagePlaceholderText: { fontSize: 14 },
  imageBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  imageBadgeText: { fontSize: 12, fontWeight: "600" },
  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  noteContent: { flex: 1, gap: 6 },
  noteBubble: {
    padding: 12,
    borderRadius: 12,
  },
  noteText: { fontSize: 14, lineHeight: 20 },
  noteMeta: { fontSize: 12 },
  verificationCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  verificationTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  checkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  checkText: { fontSize: 14 },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  confirmText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  disputeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  disputeText: { fontSize: 14, fontWeight: "500" },
});
