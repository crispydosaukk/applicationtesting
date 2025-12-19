// MenuModal.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { logoutUser } from "../utils/authHelpers";

const { width } = Dimensions.get("window");
const SIDEBAR_WIDTH = width * 0.5; // Half screen width

export default function MenuModal({ visible, setVisible, user, navigation }) {
  const slideAnim = React.useRef(new Animated.Value(SIDEBAR_WIDTH)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SIDEBAR_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleNavigation = (screen) => {
    setVisible(false);
    setTimeout(() => {
      navigation.navigate(screen);
    }, 200);
  };

  const handleLogout = () => {
    setVisible(false);
    setTimeout(() => {
      logoutUser(navigation);
    }, 200);
  };

  const menuItems = [
    { id: "home", label: "Home", icon: "home-outline", screen: "Home" },
    { id: "faq", label: "FAQ", icon: "help-circle-outline", screen: "FAQ" },
    { id: "invite", label: "Invite Friends", icon: "people-outline", screen: "InviteFriends" },
    { id: "personal", label: "Personal", icon: "person-outline", screen: "Profile" },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.modalContainer}>
        {/* Dark overlay - tap to close */}
        <Pressable
          style={styles.overlay}
          onPress={() => setVisible(false)}
        />

        {/* Sidebar */}
        <Animated.View
          style={[
            styles.sidebar,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>Menu</Text>
            <TouchableOpacity
              onPress={() => setVisible(false)}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <View style={styles.menuList}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleNavigation(item.screen)}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconWrapper}>
                  <Ionicons name={item.icon} size={24} color="#0b7a2a" />
                </View>
                <Text style={styles.menuItemText}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            ))}

            {/* Divider */}
            <View style={styles.divider} />

            {/* Logout/Sign In */}
            {user ? (
              <TouchableOpacity
                style={[styles.menuItem, styles.logoutItem]}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconWrapper, styles.logoutIconWrapper]}>
                  <Ionicons name="log-out-outline" size={24} color="#ff3b30" />
                </View>
                <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
                <Ionicons name="chevron-forward" size={20} color="#ff3b30" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setVisible(false);
                  setTimeout(() => navigation.replace("Login"), 200);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconWrapper}>
                  <Ionicons name="log-in-outline" size={24} color="#0b7a2a" />
                </View>
                <Text style={styles.menuItemText}>Sign In</Text>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sidebar: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 16,
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 60,
    backgroundColor: "#f8f8f8",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222",
  },
  closeBtn: {
    padding: 4,
  },
  menuList: {
    flex: 1,
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  divider: {
    height: 8,
    backgroundColor: "#f8f8f8",
    marginVertical: 8,
  },
  logoutItem: {
    marginTop: 4,
  },
  logoutIconWrapper: {
    backgroundColor: "#ffebee",
  },
  logoutText: {
    color: "#ff3b30",
  },
});
