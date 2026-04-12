import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppSelector } from "@/store/hooks";
import { User } from "@/types";
import { StyleSheet, Text, View } from "react-native";

const RoleIndicator = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const user = useAppSelector((state) => state.auth.user) as User;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundSecondary,
          borderTopColor: colors.border,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: colors.primary }]} />
      <Text style={[styles.label, { color: colors.primary }]}>
        {user?.role?.toUpperCase()} MODE
      </Text>
    </View>
  );
};

export default RoleIndicator;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
