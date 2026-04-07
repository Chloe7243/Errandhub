import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import Toast from "react-native-toast-message";

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
  const canGoBack = router.canGoBack();

  if (!canGoBack) return null;

  const handleCantGoBack = () => {
    Toast.show({
      type: "error",
      text1: "Can't go back",
      text2: "You're already at the first screen.",
    });
  };

  return (
    <TouchableOpacity
      onPress={
        canGoBack ? (onBack ? onBack : () => router.back()) : handleCantGoBack
      }
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
