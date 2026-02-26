// app/helper/home.tsx
import Avatar from "@/components/avatar";
import NearbyTaskCard from "@/components/task-card";
import { Colors } from "@/constants/theme";
import { useRouter } from "expo-router";
import {
  CheckCircle,
  MapPin,
  Navigation,
  TrendingUp,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Task = {
  id: string;
  title: string;
  price: string;
  distance: string;
  urgency: string;
  requester: string;
};

const nearbyTasks: Task[] = [
  {
    id: "1",
    title: "Pick up dry cleaning",
    price: "$5.00",
    distance: "2.5km away",
    urgency: "Quick",
    requester: "Sarah",
  },
  {
    id: "2",
    title: "Grocery run",
    price: "$12.00",
    distance: "1.2km away",
    urgency: "Standard",
    requester: "James",
  },
  {
    id: "3",
    title: "Drop off parcel",
    price: "$8.00",
    distance: "3.1km away",
    urgency: "Scheduled",
    requester: "Priya",
  },
];

const HelperHome = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const [isAvailable, setIsAvailable] = useState<boolean>(false);

  const handleAccept = (id: string): void => {
    console.log("Accepted task", id);
  };

  const handleDecline = (id: string): void => {
    console.log("Declined task", id);
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
          <View style={styles.userInfo}>
            <Avatar firstName="Alex" lastName="Helper" size={50} />
            <View>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                Good Morning,
              </Text>
              <Text style={[styles.name, { color: colors.text }]}>Alex</Text>
            </View>
          </View>

          {/* Availability Toggle */}
          <View
            style={[
              styles.availabilityRow,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.availabilityTitle, { color: colors.text }]}>
                {isAvailable ? "You are available" : "You are unavailable"}
              </Text>
              <Text
                style={[
                  styles.availabilitySubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                {isAvailable
                  ? "Nearby tasks will be sent to you"
                  : "Toggle on to start receiving tasks"}
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={setIsAvailable}
              trackColor={{ false: colors.border, true: colors.success }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Earnings Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Earnings
          </Text>
          <View style={styles.cardsRow}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <TrendingUp size={18} color={colors.primary} />
              <Text style={[styles.cardValue, { color: colors.text }]}>
                £12.50
              </Text>
              <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
                Today
              </Text>
            </View>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <TrendingUp size={18} color={colors.success} />
              <Text style={[styles.cardValue, { color: colors.text }]}>
                £127.50
              </Text>
              <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
                This Week
              </Text>
            </View>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <CheckCircle size={18} color={colors.cta} />
              <Text style={[styles.cardValue, { color: colors.text }]}>24</Text>
              <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
                Completed
              </Text>
            </View>
          </View>
        </View>

        {/* Active Task */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Active Task
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.activeTaskCard,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.primary,
              },
            ]}
          >
            <View style={styles.activeTaskHeader}>
              <View
                style={[
                  styles.activeTaskBadge,
                  { backgroundColor: colors.warning + "20" },
                ]}
              >
                <Text
                  style={[
                    styles.activeTaskBadgeText,
                    { color: colors.warning },
                  ]}
                >
                  In Progress
                </Text>
              </View>
              <Text style={[styles.activeTaskPrice, { color: colors.primary }]}>
                $15.00
              </Text>
            </View>
            <Text style={[styles.activeTaskTitle, { color: colors.text }]}>
              Pick up groceries
            </Text>
            <View style={styles.activeTaskLocation}>
              <MapPin size={14} color={colors.textSecondary} />
              <Text
                style={[
                  styles.activeTaskLocationText,
                  { color: colors.textSecondary },
                ]}
              >
                Whole Foods, 123 Main St
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.continueButton,
                { backgroundColor: colors.primary },
              ]}
              activeOpacity={0.8}
              onPress={() => {
                router.push("/helper/task-details");
              }}
            >
              <Navigation size={16} color="#fff" />
              <Text style={styles.continueButtonText}>Continue Task</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* Nearby Tasks */}
        <View style={[styles.section]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Nearby Tasks
            </Text>
            <TouchableOpacity>
              <Text style={[styles.viewAll, { color: colors.primary }]}>
                View all
              </Text>
            </TouchableOpacity>
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
              <Text
                style={[
                  styles.unavailableText,
                  { color: colors.textSecondary },
                ]}
              >
                Toggle availability on to see and receive nearby tasks
              </Text>
            </View>
          ) : (
            nearbyTasks.map((task) => (
              <NearbyTaskCard
                key={task.id}
                task={task}
                onAccept={handleAccept}
                onDecline={handleDecline}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HelperHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  greeting: {
    fontSize: 14,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
  },
  availabilityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  availabilityTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  availabilitySubtitle: {
    fontSize: 12,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  viewAll: {
    fontSize: 16,
    fontWeight: 600,
  },
  cardsRow: {
    flexDirection: "row",
    gap: 10,
  },
  card: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  cardTitle: {
    fontSize: 11,
  },
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
  activeTaskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  activeTaskBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  activeTaskPrice: {
    fontSize: 16,
    fontWeight: "700",
  },
  activeTaskTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  activeTaskLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  activeTaskLocationText: {
    fontSize: 13,
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  unavailableBanner: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  unavailableText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
});
