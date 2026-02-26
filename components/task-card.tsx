// components/NearbyTaskCard.tsx
import { Colors } from "@/constants/theme";
import { MapPin } from "lucide-react-native";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

type Task = {
  id: string;
  title: string;
  price: string;
  distance: string;
  urgency: string;
  requester: string;
};

type NearbyTaskCardProps = {
  task: Task;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
};

const TaskCard = ({ task, onAccept, onDecline }: NearbyTaskCardProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];

  return (
    <View
      style={[
        styles.taskCard,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.taskCardHeader}>
        <View
          style={[
            styles.urgencyBadge,
            { backgroundColor: colors.primary + "15" },
          ]}
        >
          <Text style={[styles.urgencyText, { color: colors.primary }]}>
            {task.urgency}
          </Text>
        </View>
        <Text style={[styles.taskPrice, { color: colors.primary }]}>
          {task.price}
        </Text>
      </View>

      <Text style={[styles.taskTitle, { color: colors.text }]}>
        {task.title}
      </Text>

      <View style={styles.taskMeta}>
        <MapPin size={13} color={colors.textSecondary} />
        <Text style={[styles.taskMetaText, { color: colors.textSecondary }]}>
          {task.distance} · Requester: {task.requester}
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.taskActions}>
        <TouchableOpacity
          style={[styles.declineBtn, { borderColor: colors.border }]}
          activeOpacity={0.7}
          onPress={() => onDecline(task.id)}
        >
          <Text
            style={[styles.declineBtnText, { color: colors.textSecondary }]}
          >
            Decline
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.acceptBtn, { backgroundColor: colors.success }]}
          activeOpacity={0.8}
          onPress={() => onAccept(task.id)}
        >
          <Text style={styles.acceptBtnText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TaskCard;

const styles = StyleSheet.create({
  taskCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  taskCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: "600",
  },
  taskPrice: {
    fontSize: 15,
    fontWeight: "700",
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  taskMetaText: {
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  taskActions: {
    flexDirection: "row",
    gap: 10,
  },
  declineBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  declineBtnText: {
    fontSize: 14,
    fontWeight: "500",
  },
  acceptBtn: {
    flex: 2,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  acceptBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
