import Avatar from "@/components/avatar";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { formatErrandStatus, formatErrandType } from "@/utils/errand";
import { ErrandStatus, ErrandType } from "@errandhub/shared";
import { Entypo, Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  type: ErrandType;
  status: ErrandStatus;
  title: string;
  location: string;
  amount?: number | null;
  time: string;
  helperFirstName?: string | null;
  helperLastName?: string | null;
  helperAvatar?: string | null;
  onPress?: () => void;
};

const statusColors: Record<ErrandStatus, string> = {
  POSTED: "#F59E0B",
  TENTATIVELY_ACCEPTED: "#8B5CF6",
  ACCEPTED: "#3B82F6",
  IN_PROGRESS: "#6366F1",
  REVIEWING: "#8B5CF6",
  COMPLETED: "#10B981",
  CANCELLED: "#EF4444",
  EXPIRED: "#6B7280",
  DISPUTED: "#EF4444",
};

const ErrandCard = ({
  type,
  status,
  title,
  location,
  amount,
  time,
  helperFirstName,
  helperLastName,
  helperAvatar,
  onPress,
}: Props) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const statusColor = statusColors[status];
  const hasHelper = !!helperFirstName;
  const isTerminal = status === "CANCELLED" || status === "DISPUTED";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isTerminal ? statusColor + "40" : colors.border,
        },
      ]}
    >
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.badges}>
          <Text
            style={[
              styles.badge,
              {
                backgroundColor: colors.backgroundSecondary,
                color: colors.textSecondary,
              },
            ]}
          >
            {formatErrandType(type)}
          </Text>
          <View style={styles.statusRow}>
            <Entypo name="dot-single" size={20} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {formatErrandStatus(status)}
            </Text>
          </View>
        </View>

        {/* Amount — show agreed or pending */}
        {amount ? (
          <Text style={[styles.amount, { color: colors.primary }]}>
            £{amount?.toFixed(2)}
          </Text>
        ) : (
          <Text style={[styles.amountPending, { color: colors.textTertiary }]}>
            Awaiting bids
          </Text>
        )}
      </View>

      {/* Title + location */}
      <View style={{ gap: 4 }}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.locationRow}>
          <Ionicons
            name="location-outline"
            size={12}
            color={colors.textSecondary}
          />
          <Text
            style={[styles.location, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {location}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Footer */}
      <View style={styles.footer}>
        {/* Helper info or waiting state */}
        {hasHelper ? (
          <View style={styles.helperRow}>
            <Avatar
              firstName={helperFirstName}
              lastName={helperLastName ?? ""}
              uri={helperAvatar ?? undefined}
              size={28}
            />
            <Text style={[styles.helperName, { color: colors.textSecondary }]}>
              {helperFirstName} {helperLastName}
            </Text>
          </View>
        ) : (
          <View style={styles.helperRow}>
            <Ionicons
              name="person-outline"
              size={14}
              color={colors.textTertiary}
            />
            <Text style={[styles.noHelper, { color: colors.textTertiary }]}>
              {status === "POSTED"
                ? "Waiting for helpers"
                : "No helper assigned"}
            </Text>
          </View>
        )}

        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
          <Text style={[styles.time, { color: colors.textTertiary }]}>
            {time}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ErrandCard;

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "500",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  amount: {
    fontSize: 18,
    fontWeight: "700",
  },
  amountPending: {
    fontSize: 12,
    fontStyle: "italic",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  location: {
    fontSize: 13,
    flex: 1,
  },
  divider: { height: 1 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  helperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  helperName: {
    fontSize: 13,
  },
  noHelper: {
    fontSize: 12,
    fontStyle: "italic",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  time: { fontSize: 12 },
});
