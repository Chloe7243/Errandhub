import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

type Props = {
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isError?: boolean;
  fullScreen?: boolean;
  variant?: "default" | "card";
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * Placeholder used inside lists and whole screens when there is no data or
 * an error occurred. `variant="card"` renders a bordered container
 * suitable for embedding in a list; `variant="default"` is unbordered for
 * fullscreen usage. `isError` switches the icon to an alert and the text
 * to the error colour.
 */
const EmptyState = ({
  message,
  icon = "information-circle-outline",
  isError = false,
  fullScreen = false,
  variant = "card",
  containerStyle,
}: Props) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];

  return (
    <View
      style={[
        styles.container,
        fullScreen && { flex: 1 },
        variant === "card" && {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 10,
        },
        containerStyle,
      ]}
    >
      <Ionicons
        name={isError ? "alert-circle-outline" : icon}
        size={variant === "card" ? 28 : 40}
        color={isError ? colors.error : colors.textTertiary}
      />
      <Text
        style={[
          styles.message,
          { color: isError ? colors.error : colors.textTertiary },
          variant === "card" && { fontSize: 13 },
        ]}
      >
        {message || (isError ? "Something went wrong" : "No data available")}
      </Text>
    </View>
  );
};

export default EmptyState;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  message: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
});
