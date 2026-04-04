// components/ExpandableSection.tsx
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { Colors } from "@/constants/theme";

type ExpandableSectionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  expanded: boolean;
  onPress: () => void;
  children: React.ReactNode;
  containerStyle?: ViewStyle;
};

const ExpandableSection = ({
  icon,
  label,
  expanded,
  onPress,
  children,
  containerStyle,
}: ExpandableSectionProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];

  return (
    <View style={[containerStyle]}>
      <TouchableOpacity
        style={[
          styles.row,
          {
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
            borderBottomLeftRadius: expanded ? 0 : 10,
            borderBottomRightRadius: expanded ? 0 : 10,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.rowLeft}>
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: colors.primary + "15" },
            ]}
          >
            <Ionicons name={icon} size={16} color={colors.primary} />
          </View>
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        </View>
        {expanded ? (
          <ChevronUp size={18} color={colors.textTertiary} />
        ) : (
          <ChevronDown size={18} color={colors.textTertiary} />
        )}
      </TouchableOpacity>

      {expanded && (
        <View
          style={[
            styles.panel,
            {
              borderColor: colors.border,
              backgroundColor: colors.backgroundSecondary,
            },
          ]}
        >
          {children}
        </View>
      )}
    </View>
  );
};

export default ExpandableSection;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  panel: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    padding: 14,
    gap: 10,
  },
});
