import AppLogo from "@/components/app-logo";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const HomeScreen = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Logo */}
      <AppLogo />

      <View style={styles.buttonsContainer}>
        {/* Log In Button */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/login")}
        >
          <Text style={[styles.buttonText, { color: "#fff" }]}>Log In</Text>
        </TouchableOpacity>
        {/* Sign Up Button */}
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.backgroundSecondary },
          ]}
          onPress={() => router.push("/signup")}
        >
          <Text
            style={[
              styles.buttonText,
              {
                color: colors.text,
                backgroundColor: colors.backgroundSecondary,
              },
            ]}
          >
            Sign Up
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.divider}>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
        <Text
          style={{
            color: colors.textTertiary,
            marginHorizontal: 10,
            textTransform: "uppercase",
          }}
        >
          or continue with
        </Text>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
      </View>

      <View style={[styles.buttonsContainer, { flexDirection: "row" }]}>
        {/* Google Sign In Button */}
        <TouchableOpacity
          style={[styles.thirdPartyButton, { borderColor: colors.border }]}
        >
          <FontAwesome name="google" size={24} color={colors.text} />
          <Text style={[styles.buttonText, { color: colors.text }]}>
            Google
          </Text>
        </TouchableOpacity>
        {/* Apple Sign in Button */}
        <TouchableOpacity
          style={[styles.thirdPartyButton, { borderColor: colors.border }]}
          onPress={() => router.push("/(auth)/signup")}
        >
          <FontAwesome name="apple" size={24} color={colors.text} />
          <Text style={[styles.buttonText, { color: colors.text }]}>Apple</Text>
        </TouchableOpacity>
      </View>
      <Text
        style={{
          width: "90%",
          color: colors.textTertiary,
          fontSize: 12,
          marginTop: 16,
          textAlign: "center",
        }}
      >
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </Text>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonsContainer: {
    width: "90%",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 16,
    marginVertical: 32,
  },
  button: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  thirdPartyButton: {
    paddingVertical: 16,
    borderRadius: 12,
    display: "flex",
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    flex: 1,
    minWidth: 120,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
  },
  line: {
    flex: 1,
    height: 1,
  },
});
