// AppHeader.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function AppHeader({ user, onMenuPress, navigation, cartItems }) {
  const totalItems = cartItems
    ? Object.values(cartItems).reduce((sum, qty) => sum + qty, 0)
    : 0;

  const username = user?.full_name
    ? user.full_name.split(" ")[0]
    : user?.restaurant_name
    ? user.restaurant_name
    : "Guest";

  return (
    <LinearGradient
      colors={["#d7f7df", "#ffffff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.header}
    >
      {/* LEFT SECTION */}
      <TouchableOpacity
        style={styles.leftRow}
        activeOpacity={0.8}
        onPress={() => {
          if (!user) navigation.replace("Login");
        }}
      >
        <Ionicons
          name="person-circle-outline"
          size={42}
          color="#222"
          style={{ marginRight: 10 }}
        />

        <View>
          <Text style={styles.helloText}>Hello {username} 👋</Text>
          <Text style={styles.subText}>
            {user ? "What are you craving today?" : "Tap to sign in"}
          </Text>
        </View>
      </TouchableOpacity>

      {/* RIGHT SECTION */}
      <View style={styles.rightIcons}>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={26} color="#222" />
        </TouchableOpacity>

        {/* CART ICON */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("CartSummary")}
        >
          <Ionicons name="cart-outline" size={28} color="#222" />

          {totalItems > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* MENU */}
        <TouchableOpacity style={styles.iconButton} onPress={onMenuPress}>
          <Ionicons name="menu-outline" size={32} color="#222" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    paddingTop: 10,
    paddingBottom: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    // subtle shadow
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
  },

  leftRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  helloText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222",
  },

  subText: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },

  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconButton: {
    marginLeft: 14,
    padding: 4,
    position: "relative",
  },

  badge: {
    position: "absolute",
    right: -4,
    top: -4,
    backgroundColor: "#ff3b30",
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 8.5,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
