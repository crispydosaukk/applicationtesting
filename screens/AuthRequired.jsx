import React from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

export function AuthRequiredModal({ visible, onClose, onSignIn }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="lock-closed-outline" size={36} color="#0b7a2a" />
          </View>
          <Text style={styles.title}>Please sign in to view details</Text>
          <Text style={styles.subtitle} numberOfLines={3}>
            Sign in to access your orders, wallet and credits. Enjoy a secure, personalized and premium experience.
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
              <Text style={styles.secondaryText}>Maybe later</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={onSignIn}>
              <Text style={styles.primaryText}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function AuthRequiredInline({ onSignIn, description }) {
  return (
    <View style={{ alignItems: "center", padding: 20 }}>
      <View style={styles.inlineCard}>
        <View style={styles.iconWrapInline}>
          <Ionicons name="person-circle-outline" size={44} color="#0b7a2a" />
        </View>
        <Text style={styles.inlineTitle}>Please sign in to continue</Text>
        <Text style={styles.inlineSubtitle} numberOfLines={3}>
          {description || "Sign in to access your orders, wallet and credits."}
        </Text>
        <TouchableOpacity style={styles.primaryBtnInline} onPress={onSignIn}>
          <Text style={styles.primaryText}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    elevation: 6,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(11,122,42,0.06)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: "#0b7a2a",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    color: "#fff",
    fontWeight: "800",
  },
  secondaryBtn: {
    backgroundColor: "transparent",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    minWidth: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: {
    color: "#374151",
    fontWeight: "700",
  },

  inlineCard: {
    width: "100%",
    maxWidth: 560,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    elevation: 4,
  },
  iconWrapInline: {
    marginBottom: 12,
  },
  inlineTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
  },
  inlineSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    marginVertical: 12,
  },
  primaryBtnInline: {
    backgroundColor: "#0b7a2a",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
});
