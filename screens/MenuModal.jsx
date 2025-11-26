// MenuModal.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Modal,
} from "react-native";
import { logoutUser } from "../utils/authHelpers";

export default function MenuModal({ visible, setVisible, user, navigation }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.modalContainer}>
        {/* Tap outside to close */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setVisible(false)}
        />

        {/* Dropdown menu box (top-right, below header) */}
        <View style={styles.menuBox}>
          {user ? (
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => {
                setVisible(false);
                logoutUser(navigation);
              }}
            >
              <Text style={styles.menuText}>Logout</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => {
                setVisible(false);
                navigation.replace("Login");
              }}
            >
              <Text style={styles.menuText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.0)", // no dark overlay, just transparent
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  menuBox: {
    marginTop: 70, // adjust if needed to sit just below header
    marginRight: 15,
    width: 160,
    backgroundColor: "#fff",
    borderRadius: 5,
    paddingVertical: 12,
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  menuBtn: { paddingVertical: 12, paddingHorizontal: 18 },
  menuText: { fontSize: 16, color: "#333", fontWeight: "600" },
});
