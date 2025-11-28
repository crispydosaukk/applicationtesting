import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function BottomBar({ navigation }) {
  return (
    <View style={styles.container}>

      {/* HOME */}
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => navigation.navigate("Home")}
      >
        <Ionicons name="home-outline" size={24} color="#333" />
        <Text style={styles.label}>Home</Text>
      </TouchableOpacity>

      {/* ORDERS */}
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => navigation.navigate("Orders")}
      >
        <Ionicons name="receipt-outline" size={24} color="#333" />
        <Text style={styles.label}>Orders</Text>
      </TouchableOpacity>

      {/* FLOATING SCAN BUTTON */}
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => navigation.navigate("Scanner")}
        activeOpacity={0.8}
      >
        <Ionicons name="scan-outline" size={34} color="#fff" />
      </TouchableOpacity>

      {/* CREDITS */}
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => navigation.navigate("Credits")}
      >
        <Ionicons name="wallet-outline" size={24} color="#333" />
        <Text style={styles.label}>Credits</Text>
      </TouchableOpacity>

      {/* PROFILE */}
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => navigation.navigate("Profile")}
      >
        <Ionicons name="person-outline" size={24} color="#333" />
        <Text style={styles.label}>Profile</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 66,
    flexDirection: "row",
    backgroundColor: "#fff",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 6,
    borderTopWidth: 0.4,
    borderColor: "#e2e2e2",

    // soft shadow
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
  },

  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 60,
  },

  label: {
    fontSize: 11.5,
    marginTop: 2,
    color: "#444",
    fontWeight: "500",
  },

  scanButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#28a745", // GREEN THEME
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,

    // floating look
    elevation: 14,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
});
