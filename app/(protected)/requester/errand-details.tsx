import Avatar from "@/components/avatar";
import ErrandStepper from "@/components/errand-stepper";
import BackButton from "@/components/ui/back-button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MOCK_ERRAND = {
  id: "1",
  type: "Standard",
  status: "completed" as const,
  title: "Buy Groceries",
  description: "Buy 1L semi-skimmed milk, loaf of bread, 6 eggs",
  location: "Tesco Metro, Campus",
  deliveryLocation: "Building 3, Room 42",
  amount: "£35.00",
  time: "10 mins ago",
  helper: {
    firstName: "Mike",
    lastName: "T",
    rating: 4.8,
    completedTasks: 53,
  },
};

const ErrandDetails = () => {
  const errand = MOCK_ERRAND;
  const isUnderReview = true;
  const isCompleted = errand.status === "completed";
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const router = useRouter();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <BackButton />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>
            Errand Details
          </Text>
        </View>
        {/* Status Banner */}
        <ErrandStepper currentStep="in_progress" />
        {/* Map (active only) */}
        {!isCompleted && (
          <View
            style={[
              styles.mapContainer,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              },
            ]}
          >
            {/* swap with real MapView later */}
            <View style={styles.mapPlaceholder}>
              <Ionicons
                name="map-outline"
                size={32}
                color={colors.textTertiary}
              />
              <Text style={[styles.mapText, { color: colors.textTertiary }]}>
                Map Loading...
              </Text>
            </View>
            {/* ETA Bar */}
            <View style={[styles.etaBar, { backgroundColor: colors.surface }]}>
              <View style={styles.etaStat}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={colors.primary}
                />
                <Text style={[styles.etaValue, { color: colors.text }]}>
                  12 min
                </Text>
                <Text style={[styles.etaLabel, { color: colors.textTertiary }]}>
                  ETA
                </Text>
              </View>
              <View
                style={[styles.etaDivider, { backgroundColor: colors.border }]}
              />
              <View style={styles.etaStat}>
                <Ionicons
                  name="navigate-outline"
                  size={16}
                  color={colors.primary}
                />
                <Text style={[styles.etaValue, { color: colors.text }]}>
                  0.8 mi
                </Text>
                <Text style={[styles.etaLabel, { color: colors.textTertiary }]}>
                  Away
                </Text>
              </View>
              <View
                style={[styles.etaDivider, { backgroundColor: colors.border }]}
              />
              <View style={styles.etaStat}>
                <Ionicons name="ellipse" size={10} color={colors.success} />
                <Text style={[styles.etaValue, { color: colors.text }]}>
                  En Route
                </Text>
                <Text style={[styles.etaLabel, { color: colors.textTertiary }]}>
                  Status
                </Text>
              </View>
            </View>
          </View>
        )}
        {/* Errand Info */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardRow}>
            <Text
              style={[
                styles.badge,
                {
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                },
              ]}
            >
              {errand.type}
            </Text>
            <Text style={[styles.amount, { color: colors.primary }]}>
              {errand.amount}
            </Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            {errand.title}
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {errand.description}
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.locationRow}>
            <Ionicons
              name="storefront-outline"
              size={16}
              color={colors.textTertiary}
            />
            <Text
              style={[styles.locationText, { color: colors.textSecondary }]}
            >
              {errand.location}
            </Text>
          </View>
          <View style={styles.locationRow}>
            <Ionicons
              name="location-outline"
              size={16}
              color={colors.textTertiary}
            />
            <Text
              style={[styles.locationText, { color: colors.textSecondary }]}
            >
              {errand.deliveryLocation}
            </Text>
          </View>
        </View>
        {/* Helper Info */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {!isCompleted ? "Your Helper" : "Completed by"}
          </Text>
          <View style={styles.helperRow}>
            <Avatar
              firstName={errand.helper.firstName}
              lastName={errand.helper.lastName}
              size={48}
            />
            <View style={styles.helperInfo}>
              <Text style={[styles.helperName, { color: colors.text }]}>
                {errand.helper.firstName} {errand.helper.lastName}
              </Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text
                  style={[styles.ratingText, { color: colors.textSecondary }]}
                >
                  {errand.helper.rating} • {errand.helper.completedTasks} tasks
                </Text>
              </View>
            </View>
            {!isCompleted && (
              <>
                <TouchableOpacity
                  style={[styles.contact, { backgroundColor: colors.primary }]}
                  onPress={() => router.push("/requester/chat")}
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={22}
                    color={colors.text}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.contact, { backgroundColor: colors.primary }]}
                  // onPress={() => router.push("/requester/chat")}
                >
                  <Ionicons name="call-outline" size={22} color={colors.text} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
        {/* Completed info */}
        {isCompleted && (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.cardRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Amount Paid
              </Text>
              <Text style={[styles.amount, { color: colors.primary }]}>
                {errand.amount}
              </Text>
            </View>
            <View style={styles.cardRow}>
              <Text
                style={[styles.locationText, { color: colors.textSecondary }]}
              >
                Completed
              </Text>
              <Text
                style={[styles.locationText, { color: colors.textSecondary }]}
              >
                {errand.time}
              </Text>
            </View>
          </View>
        )}
        {isUnderReview && (
          <TouchableOpacity
            style={[
              {
                backgroundColor: colors.primary,
                borderRadius: 18,
                padding: 20,
              },
            ]}
            onPress={() => router.push("/requester/review-completion")}
          >
            <Text
              style={{
                color: "#fff",
                textAlign: "center",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Review completion
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ErrandDetails;

const styles = StyleSheet.create({
  container: { flex: 1, paddingVertical: 5, paddingHorizontal: 20, gap: 16 },
  scroll: {
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: { fontSize: 20, fontWeight: "700" },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  bannerText: { fontSize: 14, fontWeight: "600" },
  mapContainer: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  mapPlaceholder: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  mapText: { fontSize: 14 },
  etaBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  etaStat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  etaValue: { fontSize: 15, fontWeight: "700" },
  etaLabel: { fontSize: 11 },
  etaDivider: { width: 1, height: 36 },
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "500",
  },
  amount: { fontSize: 20, fontWeight: "700" },
  title: { fontSize: 18, fontWeight: "700" },
  description: { fontSize: 14, lineHeight: 20 },
  divider: { height: 1 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  locationText: { fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "600" },
  helperRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  helperInfo: { flex: 1, gap: 4 },
  helperName: { fontSize: 16, fontWeight: "600" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 13 },
  contact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
  },
});
