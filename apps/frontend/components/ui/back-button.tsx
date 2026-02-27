import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

const BackButton = ({
  icon,
  onBack,
  noText = false,
}: {
  onBack?: () => any;
  noText?: boolean;
  icon?: ReactNode;
}) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];

  return (
    <TouchableOpacity
      onPress={onBack ? onBack : () => router.back()}
      style={[styles.button]}
    >
      {icon ? (
        icon
      ) : (
        <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
      )}
      {!noText && (
        <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Back</Text>
      )}
    </TouchableOpacity>
  );
};

export default BackButton;

const styles = StyleSheet.create({
  button: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
});
