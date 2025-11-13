import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { logoutUser } from "../utils/authHelpers";

export default function Resturent({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Restaurant Dashboard</Text>

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => logoutUser(navigation)} // 👈 This clears token & redirects
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, marginBottom: 20 },
  logoutBtn: {
    backgroundColor: "#FF7A00",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  logoutText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
