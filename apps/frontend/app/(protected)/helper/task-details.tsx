import Avatar from "@/components/avatar";
import BackButton from "@/components/ui/back-button";
import { Colors } from "@/constants/theme";
import { useRouter } from "expo-router";
import {
  Clock,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
} from "lucide-react-native";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
// import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

const TaskDetails = ({ task }: { task: any }) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];

  const mockTask = task ?? {
    id: "1",
    title: "Pick up dry cleaning",
    price: "$5.00",
    distance: "2.5km away",
    urgency: "Quick",
    status: "Pending",
    requester: { firstName: "Sarah", lastName: "L" },
    description:
      "Please pick up my dry cleaning from Downtown Cleaners. The ticket number is #4492. It's already paid for, just need pickup and dropoff at my apartment lobby.",
    pickupLocation: "Downtown Cleaners",
    dropoffLocation: "123 Main St, Suite 4B",
    postedAt: "10 mins ago",
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
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
        <BackButton noText />
        <Text style={[styles.pageTitle, { color: colors.text }]}>
          Task Details
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Map */}
        <View style={[styles.mapContainer, { borderColor: colors.border }]}>
          {/* <MapView
            style={styles.map}
            initialRegion={{
              latitude: 37.78825,
              longitude: -122.4324,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          /> */}
          <TouchableOpacity
            style={[styles.navigateButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Navigation size={14} color="#fff" />
            <Text style={styles.navigateButtonText}>Navigate</Text>
          </TouchableOpacity>
        </View>

        {/* Task Header */}
        <View style={styles.section}>
          <View style={styles.taskHeaderRow}>
            <View
              style={[
                styles.urgencyBadge,
                { backgroundColor: colors.primary + "15" },
              ]}
            >
              <Text style={[styles.urgencyText, { color: colors.primary }]}>
                {mockTask.urgency}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <View
                style={[styles.statusDot, { backgroundColor: colors.warning }]}
              />
              <Text style={[styles.statusText, { color: colors.warning }]}>
                {mockTask.status}
              </Text>
            </View>
          </View>

          <View style={styles.titlePriceRow}>
            <Text style={[styles.taskTitle, { color: colors.text }]}>
              {mockTask.title}
            </Text>
            <Text style={[styles.taskPrice, { color: colors.primary }]}>
              {mockTask.price}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <MapPin size={13} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {mockTask.distance}
            </Text>
            <Clock size={13} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {mockTask.postedAt}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Requester */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Requester
          </Text>
          <View style={styles.requesterRow}>
            <Avatar
              firstName={mockTask.requester.firstName}
              lastName={mockTask.requester.lastName}
              size={44}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.requesterName, { color: colors.text }]}>
                {mockTask.requester.firstName} {mockTask.requester.lastName}
              </Text>
              <Text
                style={[styles.requesterSub, { color: colors.textSecondary }]}
              >
                Requester
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.iconButton,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <MessageCircle size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.iconButton,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <Phone size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Description
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {mockTask.description}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Locations */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Locations
          </Text>
          <View style={styles.locationBlock}>
            <View style={styles.locationRow}>
              <View
                style={[
                  styles.locationDot,
                  { backgroundColor: colors.primary },
                ]}
              />
              <View>
                <Text
                  style={[
                    styles.locationLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Pickup Location
                </Text>
                <Text style={[styles.locationValue, { color: colors.text }]}>
                  {mockTask.pickupLocation}
                </Text>
              </View>
            </View>
            <View
              style={[styles.locationLine, { backgroundColor: colors.border }]}
            />
            <View style={styles.locationRow}>
              <View
                style={[styles.locationDot, { backgroundColor: colors.cta }]}
              />
              <View>
                <Text
                  style={[
                    styles.locationLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Drop-off Location
                </Text>
                <Text style={[styles.locationValue, { color: colors.text }]}>
                  {mockTask.dropoffLocation}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.acceptBtn, { backgroundColor: colors.success }]}
            activeOpacity={0.8}
            onPress={() => router.push("/helper/upload-proof")}
          >
            <Text style={styles.acceptBtnText}>Mark as complete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TaskDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  content: {
    paddingBottom: 32,
  },
  mapContainer: {
    height: 200,
    borderBottomWidth: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  navigateButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  navigateButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  taskHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  urgencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "500",
  },
  titlePriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    marginRight: 12,
  },
  taskPrice: {
    fontSize: 18,
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  requesterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  requesterName: {
    fontSize: 15,
    fontWeight: "600",
  },
  requesterSub: {
    fontSize: 12,
    marginTop: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  locationBlock: {
    gap: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  locationLine: {
    width: 2,
    height: 20,
    marginLeft: 4,
    marginVertical: 2,
  },
  locationLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  locationValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  declineBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  declineBtnText: {
    fontSize: 15,
    fontWeight: "500",
  },
  acceptBtn: {
    flex: 2,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  acceptBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
