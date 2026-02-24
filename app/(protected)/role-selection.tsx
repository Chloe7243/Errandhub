import BackButton from "@/components/ui/back-button";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const RoleSelection = () => {
  return (
    <View style={styles.container}>
      <BackButton />
      <View style={styles.header}>
        <Text style={styles.headerText}>Welcome, {"Alex"}</Text>
        <Text style={styles.subtitle}>
          How would you like to use ErrandHub today?
        </Text>
      </View>

      <View style={styles.roles}>
        <View style={[styles.roleCard]}>
          <FontAwesome5 name="clipboard-list" size={24} color="black" />
          <Text style={styles.roleTitle}>Continue as Requester</Text>
        </View>
        <View style={styles.roleCard}>
          <FontAwesome5 name="hand-holding-heart" size={24} color="black" />
          <Text style={styles.roleTitle}>Continue as Helper</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

export default RoleSelection;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: "flex",
    gap: 32,
    padding: 24,
    alignItems: "center",
  },
  header: {
    display: "flex",
    gap: 8,
    alignItems: "center",
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
    flexDirection: "row",
    gap: 16,
  },

  roleCard: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  roleTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
