import { Colors } from "@/constants/theme";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useSelectRoleMutation } from "@/store/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loginUser } from "@/store/slices";
import { User } from "@/types";
import { Role } from "@errandhub/shared";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { router } from "expo-router";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const RoleSelection = () => {
  const dispatch = useAppDispatch();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const [selectRole, { isLoading }] = useSelectRoleMutation();
  const user = useAppSelector((state) => state.auth.user) as User;
  const [isSelected, setIsSelected] = React.useState<Role | null>(null);

  const handleRoleSelection = async () => {
    if (isLoading) return;
    if (!isSelected) {
      Toast.show({
        type: "error",
        text1: "No role selected",
        text2: "Please select a role to continue.",
      });
    } else {
      try {
        const response = await selectRole({
          userId: user.userId,
          role: isSelected,
        }).unwrap();
        console.log("Role selection response:", response);
        dispatch(
          loginUser({
            user: response.user,
            token: response.token,
          }),
        );
        router.replace(
          isSelected === "helper" ? "/helper/home" : "/requester/home",
        );
      } catch (err) {
        console.error("Login failed:", err);
        Toast.show({
          type: "error",
          text1: "Failed to select role",
          text2: "Please try again.",
        });
      }
    }
  };
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={{ flex: 1, display: "flex", gap: 32 }}>
        <View style={styles.header}>
          <Text style={[styles.headerText, { color: colors.text }]}>
            Welcome, {user?.firstName}!
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
        onPress={handleRoleSelection}
      >
        {isLoading ? (
          <LoadingSpinner color="#fff" size="small" />
        ) : (
          <Text style={[styles.buttonText, { color: colors.text }]}>
            Continue
          </Text>
        )}
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
