import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Image, StyleSheet, Text, View } from "react-native";

const AppLogo = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];

  return (
    <View style={styles.container}>
      <View style={[styles.logoBox]}>
        <Image
          source={require("@/assets/images/icon.png")}
          style={{ width: 180, height: 180 }}
        />
      </View>
      <Text style={[styles.appName, { color: colors.text }]}>ErrandHub</Text>
      <Text style={[styles.slogan, { color: colors.textSecondary }]}>
        Errands, Done Instantly
      </Text>
    </View>
  );
};

export default AppLogo;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 8,
  },
  logoBox: {
    width: 100,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
  },
  slogan: {
    fontSize: 16,
  },
});
