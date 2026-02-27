import BackButton from "@/components/ui/back-button";
import { Colors } from "@/constants/theme";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { router } from "expo-router";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const RoleSelection = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const [isSelected, setIsSelected] = React.useState<
    "requester" | "helper" | null
  >(null);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <BackButton />
      <View style={{ flex: 1, display: "flex", gap: 32 }}>
        <View style={styles.header}>
          <Text style={[styles.headerText, { color: colors.text }]}>
            Welcome, {"Alex"}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            How would you like to use ErrandHub today?
          </Text>
        </View>

        <View style={styles.roles}>
          <Pressable
            onPress={() => setIsSelected("requester")}
            style={[
              styles.roleCard,
              isSelected === "requester" && {
                borderColor: colors.primary,
                borderWidth: 2,
              },
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            <View
              style={[
                styles.roleIcon,
                {
                  backgroundColor:
                    isSelected === "requester"
                      ? colors.primary
                      : colors.background,
                },
              ]}
            >
              <FontAwesome5
                name="clipboard-list"
                size={24}
                color={colors.text}
              />
            </View>
            <View style={[styles.roleTextContainer]}>
              <Text style={[styles.roleTitle, { color: colors.text }]}>
                Continue as Requester
              </Text>
              <Text
                style={[styles.roleSubtitle, { color: colors.textSecondary }]}
              >
                Get help with errands, and save time.
              </Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => setIsSelected("helper")}
            style={[
              styles.roleCard,
              isSelected === "helper" && {
                borderColor: colors.primary,
                borderWidth: 2,
              },
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            <View
              style={[
                styles.roleIcon,
                {
                  backgroundColor:
                    isSelected === "helper"
                      ? colors.primary
                      : colors.background,
                },
              ]}
            >
              <FontAwesome5
                name="hand-holding-heart"
                size={24}
                color={colors.text}
              />
            </View>
            <View style={[styles.roleTextContainer]}>
              <Text style={[styles.roleTitle, { color: colors.text }]}>
                Continue as Helper
              </Text>
              <Text
                style={[styles.roleSubtitle, { color: colors.textSecondary }]}
              >
                Get help with errands, and save time.
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={() =>
          isSelected && isSelected === "helper"
            ? router.replace("/helper/home")
            : router.replace("/requester/home")
        }
      >
        <Text style={[styles.buttonText, { color: colors.text }]}>
          Continue
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default RoleSelection;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: "flex",
    gap: 32,
    padding: 24,
  },
  header: {
    display: "flex",
    gap: 8,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
  },
  roles: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  roleCard: {
    width: "100%",
    padding: 24,
    minHeight: 120,
    borderRadius: 12,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  roleIcon: {
    width: 48,
    height: 48,
    padding: 5,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  roleTextContainer: {
    display: "flex",
    gap: 4,
  },
  roleTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  roleSubtitle: {
    fontSize: 13,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
