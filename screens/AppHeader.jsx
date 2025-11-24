// AppHeader.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function AppHeader({ user, onMenuPress, navigation, cartItems }) {
  // Calculate total quantity of items in cart
  const totalItems = cartItems
    ? Object.values(cartItems).reduce((sum, qty) => sum + qty, 0)
    : 0;

  return (
    <LinearGradient
      colors={["#ccf5d3", "#ffffff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.header}
    >
      {/* Left: User info */}
      <TouchableOpacity
        style={styles.leftRow}
        activeOpacity={0.7}
        onPress={() => {
          if (!user) navigation.replace("Login");
        }}
      >
        <Ionicons
          name="person-circle-outline"
          size={40}
          color="#333"
          style={{ marginRight: 10 }}
        />
        <View>
          <Text style={styles.helloText}>
            Hello {user ? user.full_name.split(" ")[0] : "Guest"} 👋
          </Text>
          <Text style={styles.subText}>
            {user ? "What are you carving today?" : "Please sign in"}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Right: Icons */}
      <View style={styles.rightIcons}>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={28} color="#333" />
        </TouchableOpacity>

        {/* Cart Icon with Badge */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("CartSummary")}
        >
          <Ionicons name="cart-outline" size={28} color="#333" />
          {totalItems > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={onMenuPress}>
          <Ionicons name="menu-outline" size={32} color="#333" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    paddingVertical: 15,
    paddingHorizontal: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftRow: { flexDirection: "row", alignItems: "center" },
  helloText: { fontSize: 18, fontWeight: "700", color: "#333" },
  subText: { fontSize: 14, color: "#666" },
  rightIcons: { flexDirection: "row", alignItems: "center" },
  iconButton: { marginLeft: 12, position: "relative" },

  // Badge style
  badge: {
    position: "absolute",
    right: -6,
    top: -6,
    backgroundColor: "#ff3b30",
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
