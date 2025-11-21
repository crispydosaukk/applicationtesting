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
        <Ionicons name="home-outline" size={26} color="#444" />
        <Text style={styles.label}>Home</Text>
      </TouchableOpacity>

      {/* ORDERS */}
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => navigation.navigate("Orders")}
      >
        <Ionicons name="receipt-outline" size={26} color="#444" />
        <Text style={styles.label}>Orders</Text>
      </TouchableOpacity>

      {/* BIG SCAN BUTTON */}
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => navigation.navigate("Scanner")}
      >
        <Ionicons name="scan-outline" size={40} color="#fff" />
      </TouchableOpacity>

      {/* CREDITS */}
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => navigation.navigate("Credits")}
      >
        <Ionicons name="wallet-outline" size={26} color="#444" />
        <Text style={styles.label}>Credits</Text>
      </TouchableOpacity>

      {/* PROFILE */}
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => navigation.navigate("Profile")}
      >
        <Ionicons name="person-outline" size={26} color="#444" />
        <Text style={styles.label}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 70,
    flexDirection: "row",
    backgroundColor: "#fff",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingBottom: 5,
    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    borderTopWidth: 0.3,
    borderColor: "#ddd",
  },

  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 70,
  },

  label: {
    fontSize: 12,
    marginTop: 2,
    color: "#444",
  },

  scanButton: {
    width: 75,
    height: 75,
    borderRadius: 40,
    backgroundColor: "#ff5c5c",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30, // FLOATING EFFECT
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
});
