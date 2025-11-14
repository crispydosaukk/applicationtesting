import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";
import { logoutUser } from "../utils/authHelpers";

export default function Resturent({ navigation }) {
  const [user, setUser] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    };
    loadUser();
  }, []);

  return (
    <View style={styles.container}>

      {/* TOP NAVBAR */}
      <View style={styles.header}>

        {/* Left → User/Guest */}
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
            color="#fff"
            style={{ marginRight: 10 }}
          />
          <View>
            <Text style={styles.helloText}>
              Hello {user ? user.full_name.split(" ")[0] : "Guest"} 👋
            </Text>
            <Text style={styles.subText}>
              {user ? "What are you Carving today?" : "Please sign in"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Right Side Icons */}
        <View style={styles.rightIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={28} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="wallet-outline" size={28} color="#fff" />
          </TouchableOpacity>

          {/* Menu */}
          <TouchableOpacity style={styles.iconButton} onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu-outline" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* UNDERLINE */}
      <View style={styles.underline} />

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={22} color="#ccc" />
        <TextInput
          placeholder="Search..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      {/* MENU MODAL */}
      <Modal transparent visible={menuVisible} animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuBox}>
            {user ? (
              <TouchableOpacity
                style={styles.menuBtn}
                onPress={() => {
                  setMenuVisible(false);
                  logoutUser(navigation);
                }}
              >
                <Text style={styles.menuText}>Logout</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.menuBtn}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.replace("Login");
                }}
              >
                <Text style={styles.menuText}>Sign In</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 20,
    backgroundColor: "#121212",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  leftRow: { flexDirection: "row", alignItems: "center" },

  helloText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },

  subText: {
    fontSize: 14,
    color: "#ccc",
  },

  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconButton: {
    marginLeft: 12,
  },

  underline: {
    width: "100%",
    height: 1,
    backgroundColor: "#444",
    marginTop: 10,
    marginBottom: 15,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#fff",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },

  menuBox: {
    width: 150,
    backgroundColor: "#222",
    borderRadius: 12,
    marginTop: 60,
    marginRight: 10,
    paddingVertical: 10,
  },

  menuBtn: { paddingVertical: 12, paddingHorizontal: 15 },

  menuText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
