import { StyleSheet, Text, TouchableOpacity, View, Alert } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { useRouter } from "expo-router";
import { useAppSelector } from "@/store/hooks";
import {
  useGetHelpedErrandsQuery,
  useGetRequestedErrandsQuery,
} from "@/store/api/user";
import { activeStatuses } from "@errandhub/shared";

// Helpers can't have "POSTED" errands (that's a requester-only state), so
// their active set is narrower than `activeStatuses`. Blocking role switch
// while anything is active prevents ownership confusion mid-errand.
const ACTIVE_HELPER_STATUSES = [
  "ACCEPTED",
  "IN_PROGRESS",
  "REVIEWING",
] as const;

const SwitchRole = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const role = useAppSelector((state) => state.auth.user?.role);

  const { data: requestedData } = useGetRequestedErrandsQuery(
    { status: activeStatuses as any },
    { skip: role !== "requester" },
  );
  const { data: helpedData } = useGetHelpedErrandsQuery(
    { status: ACTIVE_HELPER_STATUSES as any },
    { skip: role !== "helper" },
  );

  const activeCount =
    role === "requester"
      ? (requestedData?.errands?.length ?? 0)
      : (helpedData?.errands?.length ?? 0);

  const handleSwitchRole = () => {
    if (activeCount > 0) {
      Alert.alert(
        "Cannot Switch Role",
        "You have active errands in progress. Please complete or cancel them before switching roles.",
        [{ text: "OK" }],
      );
      return;
    }
    router.push("/role-selection");
  };

  return (
    <TouchableOpacity onPress={handleSwitchRole} style={[styles.switch]}>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <View style={[styles.text]}>
        <Ionicons name="swap-horizontal" size={18} color={colors.primary} />
        <Text style={{ color: colors.primary }}>Switch Role</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
    </TouchableOpacity>
  );
};

export default SwitchRole;

const styles = StyleSheet.create({
  switch: {
    width: "100%",
    marginVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  text: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  divider: { height: 2, flex: 1 },
});
