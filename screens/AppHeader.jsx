// AppHeader.js
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar, ActivityIndicator, Animated } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { getWalletSummary } from "../services/walletService";
import { AuthRequiredModal } from "./AuthRequired";

const { width } = Dimensions.get("window");
const scale = width / 400;

export default function AppHeader({ user, onMenuPress, navigation, cartItems }) {
  const insets = useSafeAreaInsets();
  const totalItems = cartItems ? Object.values(cartItems).reduce((a, b) => a + b, 0) : 0;

  const [walletBalance, setWalletBalance] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const fetchWallet = useCallback(async () => {
    if (!user) {
      setWalletBalance(null);
      return;
    }
    if (walletBalance === null) setLoadingWallet(true);
    try {
      const data = await getWalletSummary();
      const wb = Number(data.wallet_balance || 0);
      const lc = (data.loyalty_expiry_list || []).reduce(
        (sum, item) => sum + Number(item.credit_value || 0),
        0
      );
      setWalletBalance(wb + lc);
    } catch (e) {
      console.warn("Failed to fetch wallet summary", e);
      setWalletBalance(null);
    } finally {
      setLoadingWallet(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  useFocusEffect(
    useCallback(() => {
      // Refresh wallet whenever the header's screen regains focus
      fetchWallet();
    }, [fetchWallet])
  );

  const username = user?.full_name ? user.full_name.split(" ")[0] : user?.restaurant_name ? user.restaurant_name : "Guest";

  return (
    <>
      <StatusBar backgroundColor="#d7f7df" barStyle="dark-content" />
      <SafeAreaView style={{ width: "100%", backgroundColor: "#d7f7df", paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }} edges={["top", "left", "right"]}>
        <LinearGradient colors={["#d7f7df", "#ffffff"]} style={{ width: "100%", paddingHorizontal: 10, paddingTop: 12, paddingBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <TouchableOpacity
            style={styles.leftWrap}
            activeOpacity={0.8}
            onPress={() => {
              if (!user) setAuthModalVisible(true);
              else navigation.navigate("Profile");
            }}
          >
            <Ionicons
              name="person-circle-outline"
              size={40 * scale}
              color="#222"
              style={styles.avatar}
            />
            <Text style={styles.username} numberOfLines={1} ellipsizeMode="tail">
              {username} 👋
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity style={{ marginLeft: 6, padding: 4 }}>
              <Ionicons name="notifications-outline" size={24 * scale} color="#222" />
            </TouchableOpacity>

            {/* Wallet - Premium Full Width */}
            <TouchableOpacity
              style={{ marginLeft: 6, marginRight: 2 }}
              activeOpacity={0.8}
              onPress={() => {
                if (!user) setAuthModalVisible(true);
                else navigation.navigate("Credits");
              }}
            >
              {walletBalance !== null && walletBalance > 0 ? (
                <AnimatedBadge balance={walletBalance} loading={loadingWallet} />
              ) : (
                <View style={styles.walletPlaceholder}>
                  <Ionicons name="wallet-outline" size={24 * scale} color="#222" />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={{ marginLeft: 8, padding: 4 }} onPress={() => { if (!user) setAuthModalVisible(true); else navigation.navigate("CartSummary"); }}>
              <Ionicons name="cart-outline" size={28 * scale} color="#222" />
              {totalItems > 0 && (
                <View style={{ position: "absolute", right: -4, top: -4, backgroundColor: "#ff3b30", minWidth: 16 * scale, height: 16 * scale, borderRadius: 20, justifyContent: "center", alignItems: "center", paddingHorizontal: 3 }}>
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 10 * scale }}>{totalItems}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={{ marginLeft: 8, padding: 4 }} onPress={onMenuPress}>
              <Ionicons name="menu-outline" size={32 * scale} color="#222" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>

      <AuthRequiredModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        onSignIn={() => {
          setAuthModalVisible(false);
          try { navigation.replace("Login"); } catch (e) { navigation.navigate("Login"); }
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  walletWrap: {
    marginLeft: 10,
    paddingVertical: 5,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "rgba(16,127,47,0.04)",
    borderWidth: 1,
    borderColor: "rgba(16,127,47,0.08)",
  },
  walletTextWrap: {
    marginLeft: 6,
    minWidth: 48,
    alignItems: "flex-start",
  },
  walletText: {
    fontSize: 13 * scale,
    fontWeight: "800",
    color: "#0b7a2a",
    textShadowColor: "rgba(11,122,42,0.08)",
    textShadowRadius: 1,
  },
  walletWrapNoBorder: {
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  walletBtn: {
    marginLeft: 8,
  },
  walletIconCircle: {
    width: 36 * scale,
    height: 36 * scale,
    borderRadius: 18 * scale,
    backgroundColor: "#0b7a2a",
    justifyContent: "center",
    alignItems: "center",
  },
  walletBadge: {
    position: "absolute",
    right: -10,
    top: -14,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 24,
    borderRadius: 12,
    backgroundColor: "#0b7a2a",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    borderWidth: 1.5,
    borderColor: "#ffffff",
    zIndex: 99,
  },
  walletBadgeText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 11 * scale,
    textAlign: "center",
  },
  leftWrap: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  avatar: {
    marginRight: 8 * scale,
  },
  username: {
    fontSize: 16 * scale,
    fontWeight: "700",
    color: "#222",
    maxWidth: 160 * scale,
  },
  premiumWalletBadge: {
    backgroundColor: "#0b7a2a",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#0b7a2a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  premiumWalletText: {
    color: "#fff",
    fontSize: 14 * scale,
    fontWeight: "800",
  },
  walletPlaceholder: {
    padding: 4,
  },
});

const AnimatedBadge = ({ balance, loading }) => {
  // Blinking animation
  const [opacity] = useState(new Animated.Value(1));

  useEffect(() => {
    if (loading) return;
    const animate = () => {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };
    animate();
  }, [loading]);

  return (
    <Animated.View style={[styles.premiumWalletBadge, { opacity }]}>
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text style={styles.premiumWalletText} numberOfLines={1}>
          {`£${balance.toFixed(2)}`}
        </Text>
      )}
    </Animated.View>
  );
};
