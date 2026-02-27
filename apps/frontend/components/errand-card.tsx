import Avatar from "@/components/avatar";
import { Colors } from "@/constants/theme";
import { Entypo, Ionicons } from "@expo/vector-icons";
import {
  useColorScheme,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ErrandStatus = "new" | "active" | "completed" | "cancelled";

type Props = {
  type: "Quick" | "Standard" | "Complex";
  status: ErrandStatus;
  title: string;
  location: string;
  amount: string;
  time: string;
  helperFirstName?: string;
  helperLastName?: string;
  helperAvatar?: string;
  onPress?: () => void;
};

const statusColors: Record<ErrandStatus, string> = {
  new: "#F59E0B",
  active: "#3B82F6",
  completed: "#10B981",
  cancelled: "#EF4444",
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

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.badges}>
          <Text
            style={[
              styles.badge,
              { backgroundColor: colors.background, color: colors.text },
            ]}
          >
            {type}
          </Text>
          <View style={styles.statusRow}>
            <Entypo name="dot-single" size={20} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={[styles.amount, { color: colors.primary }]}>{amount}</Text>
      </View>

      {/* Title + location */}
      <View>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <View style={styles.locationRow}>
          <Ionicons
            name="location-outline"
            size={12}
            color={colors.textSecondary}
          />
          <Text style={[styles.location, { color: colors.textSecondary }]}>
            {location}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Footer */}
      <View style={styles.footer}>
        {helperFirstName ? (
          <Avatar
            firstName={helperFirstName}
            lastName={helperLastName}
            uri={helperAvatar}
            size={32}
          />
        ) : (
          <View />
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
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
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
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  location: {
    fontSize: 13,
  },
  divider: {
    height: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  time: {
    fontSize: 12,
  },
});
