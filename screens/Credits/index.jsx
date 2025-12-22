// screens/Credits/index.jsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useIsFocused } from "@react-navigation/native";

import BottomBar from "../BottomBar.jsx";
import {
  getWalletSummary,
  redeemLoyaltyToWallet,
} from "../../services/walletService";

import AppHeader from "../AppHeader";
import { AuthRequiredInline } from "../AuthRequired";
import MenuModal from "../MenuModal";
import { getCart } from "../../services/cartService";
import { RefreshControl } from "react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import { Share } from "react-native";

export default function CreditsScreen({ navigation }) {
  const isFocused = useIsFocused();

  // Header states
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [loyaltyExpiryList, setLoyaltyExpiryList] = useState([]);

  // Wallet/Credits states
  const [walletBalance, setWalletBalance] = useState(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState(null);
  const [pendingLoyaltyPoints, setPendingLoyaltyPoints] = useState(0); // ✅ NEW
  const [availableAfterHours, setAvailableAfterHours] = useState(24); // ✅ NEW
  const [referralCredits, setReferralCredits] = useState(null);
  const [history, setHistory] = useState([]);

  const [pendingLoyaltyList, setPendingLoyaltyList] = useState([]);
  const [referredUsersCount, setReferredUsersCount] = useState(0);

  // Toggle states for dropdowns
  const [showPending, setShowPending] = useState(false);
  const [showExpiry, setShowExpiry] = useState(false);

  // Redeem settings + loading
  const [loyaltyRedeemPoints, setLoyaltyRedeemPoints] = useState(10);
  const [loyaltyRedeemValue, setLoyaltyRedeemValue] = useState(1);
  const [redeeming, setRedeeming] = useState(false);

  const totalLoyaltyValue = loyaltyExpiryList.reduce(
    (sum, item) => sum + Number(item.credit_value || 0),
    0
  );

  // Load user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = await AsyncStorage.getItem("user");
        if (stored) setUser(JSON.parse(stored));
      } catch (e) {
        console.log("Failed to load user:", e);
      } finally {
        setLoadingUser(false);
      }
    };
    loadUser();
  }, []);

  // Fetch cart for header badge
  useEffect(() => {
    const fetchCart = async () => {
      if (!user) return;

      const customerId = user.id ?? user.customer_id;
      if (!customerId) return;

      try {
        const res = await getCart(customerId);
        if (res && res.status === 1 && Array.isArray(res.data)) {
          const map = {};
          res.data.forEach((item) => {
            const qty = item.product_quantity || 0;
            if (qty > 0) map[item.product_id] = (map[item.product_id] || 0) + qty;
          });
          setCartItems(map);
        } else {
          setCartItems({});
        }
      } catch (err) {
        console.log("Cart fetch error (Credits):", err);
      }
    };

    if (isFocused && user) fetchCart();
  }, [isFocused, user]);

  const loadCreditsData = async () => {
    if (!user) return; // skip if not signed in
    const data = await getWalletSummary();

    setWalletBalance(Number(data.wallet_balance || 0));
    setLoyaltyPoints(Number(data.loyalty_points || 0));
    setPendingLoyaltyPoints(Number(data.loyalty_pending_points || 0));
    setAvailableAfterHours(Number(data.loyalty_available_after_hours || 24));
    setReferralCredits(Number(data.referral_credits || 0));
    setLoyaltyExpiryList(
      Array.isArray(data.loyalty_expiry_list)
        ? data.loyalty_expiry_list
        : []
    );

    setPendingLoyaltyList(Array.isArray(data.loyalty_pending_list) ? data.loyalty_pending_list : []); // ✅ ADD
    setReferredUsersCount(Number(data.referred_users_count || 0));

    setLoyaltyRedeemPoints(Number(data.loyalty_redeem_points || 10));
    setLoyaltyRedeemValue(Number(data.loyalty_redeem_value || 1));
    setHistory(Array.isArray(data.history) ? data.history : []);
  };

  // Redeem call
  const handleRedeem = async () => {
    if (redeeming) return;

    const lp = Number(loyaltyPoints || 0);
    const need = Number(loyaltyRedeemPoints || 10);

    if (lp < need) {
      Alert.alert("Not enough credits", `You need at least ${need} credits to redeem.`);
      return;
    }

    try {
      setRedeeming(true);

      const res = await redeemLoyaltyToWallet();

      if (res?.status === 1) {
        Alert.alert(
          "Redeemed Successfully",
          `Converted ${res.points_redeemed} credits to £${Number(res.wallet_amount).toFixed(2)}`
        );
        await loadCreditsData();
      } else {
        Alert.alert("Redeem failed", res?.message || "Unable to redeem.");
      }
    } catch (err) {
      Alert.alert("Redeem error", "Redeem failed");
    } finally {
      setRedeeming(false);
    }
  };

  // Fetch credits whenever screen is focused or user loads
  useEffect(() => {
    if (isFocused && user) loadCreditsData();
  }, [isFocused, user]);

  // Display helpers
  const units = Math.floor(
    Number(loyaltyPoints || 0) / Number(loyaltyRedeemPoints || 10)
  );
  const willGet = Number((units * Number(loyaltyRedeemValue || 1)).toFixed(2));
  const pendingValue = ((Number(pendingLoyaltyPoints || 0) * Number(loyaltyRedeemValue || 1)) / Number(loyaltyRedeemPoints || 10)).toFixed(2);

  const onRefresh = async () => {
    try {
      setRefreshing(true);

      // reload credits
      await loadCreditsData();

      // reload cart badge
      if (user) {
        const customerId = user.id ?? user.customer_id;
        if (customerId) {
          const res = await getCart(customerId);
          if (res?.status === 1 && Array.isArray(res.data)) {
            const map = {};
            res.data.forEach((item) => {
              const qty = item.product_quantity || 0;
              if (qty > 0) map[item.product_id] = qty;
            });
            setCartItems(map);
          } else {
            setCartItems({});
          }
        }
      }
    } catch (e) {
      console.log("Credits refresh error:", e);
    } finally {
      setRefreshing(false);
    }
  };

  const copyReferralCode = () => {
    if (!user?.referral_code) return;
    Clipboard.setString(user.referral_code);
    Alert.alert("Copied", "Referral code copied to clipboard");
  };

  const shareReferralCode = async () => {
    if (!user?.referral_code) return;

    try {
      await Share.share({
        message: `Use my referral code *${user.referral_code}* and get rewards on your first order 🎉`,
      });
    } catch (err) {
      console.log("Share error:", err);
    }
  };


  return (
    <View style={styles.root}>
      <AppHeader
        user={user}
        navigation={navigation}
        cartItems={cartItems}
        onMenuPress={() => setMenuVisible(true)}
      />

      {loadingUser ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#28a745" />
        </View>
      ) : !user ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <AuthRequiredInline onSignIn={() => navigation.replace("Login")} description={"Sign in to view your wallet, referral rewards and credits details."} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >

          <Text style={styles.title}>Credits & Wallet</Text>
          <Text style={styles.subtitle}>
            Track your wallet, loyalty credits & referral rewards.
          </Text>

          <View style={styles.column}>
            <View style={[styles.card, styles.walletCard]}>
              <View style={styles.cardHeader}>
                <Ionicons name="wallet-outline" size={24} color="#10b981" />
                <Text style={styles.cardLabel}>Wallet Balance</Text>
              </View>
              <Text style={styles.cardValue}>
                {walletBalance !== null ? `£${Number(walletBalance).toFixed(2)}` : "—"}
              </Text>
              <Text style={styles.cardHint}>Use this amount at checkout for your orders.</Text>
            </View>

            <View style={[styles.card, styles.creditsCard]}>
              <View style={styles.cardHeader}>
                <Ionicons name="gift-outline" size={24} color="#3b82f6" />
                <Text style={styles.cardLabel}>Loyalty Credits</Text>
              </View>

              <View style={styles.creditsRow}>
                <Text style={styles.cardValue}>
                  £{totalLoyaltyValue.toFixed(2)}
                </Text>{/*
                  <Text style={styles.pointsSubText}>
                    ({loyaltyPoints} credits)
                  </Text>*/}
              </View>

              <Text style={styles.cardHint}>
                Use this amount at checkout
              </Text>

              {/* ✅ NEW: Pending points indication */}
              {pendingLoyaltyPoints > 0 && (
                <View style={{ marginTop: 6 }}>
                  <Text style={styles.pendingTitle}>
                    🎉 £{pendingValue} earned!
                  </Text>
                  <Text style={styles.pendingDesc}>
                    Available to use after {availableAfterHours} hour(s).
                  </Text>
                </View>
              )}

              {/* Dropdown for Pending Credits */}
              {pendingLoyaltyList.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <TouchableOpacity
                    style={styles.dropdownHeader}
                    onPress={() => setShowPending(!showPending)}
                  >
                    <Text style={styles.dropdownTitle}>View Pending Credits</Text>
                    <Ionicons
                      name={showPending ? "chevron-up" : "chevron-down"}
                      size={18}
                      color="#6b7280"
                    />
                  </TouchableOpacity>

                  {showPending && (
                    <View style={styles.dropdownContent}>
                      {pendingLoyaltyList.map((item, idx) => {
                        const unlockAt = new Date(item.available_from);
                        const hoursLeft = Math.max(
                          0,
                          Math.ceil((unlockAt.getTime() - Date.now()) / (1000 * 60 * 60))
                        );

                        return (
                          <View
                            key={item.id || idx}
                            style={styles.dropdownItem}
                          >
                            <Text style={styles.itemMainText}>
                              £{Number(item.credit_value).toFixed(2)}
                            </Text>
                            <Text style={styles.itemSubText}>
                              Unlocks in {hoursLeft} hour(s)
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}

              {/* Dropdown for Credits Expiry */}
              {loyaltyExpiryList.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <TouchableOpacity
                    style={styles.dropdownHeader}
                    onPress={() => setShowExpiry(!showExpiry)}
                  >
                    <Text style={styles.dropdownTitle}>View Credits Expiry</Text>
                    <Ionicons
                      name={showExpiry ? "chevron-up" : "chevron-down"}
                      size={18}
                      color="#6b7280"
                    />
                  </TouchableOpacity>

                  {showExpiry && (
                    <View style={styles.dropdownContent}>
                      {loyaltyExpiryList.map((item, idx) => {
                        const expiry = new Date(item.expires_at);
                        const daysLeft = Math.max(
                          0,
                          Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                        );

                        return (
                          <View
                            key={item.id || idx}
                            style={[styles.dropdownItem, { borderBottomWidth: idx === loyaltyExpiryList.length - 1 ? 0 : StyleSheet.hairlineWidth }]}
                          >
                            <Text style={styles.itemMainText}>
                              £{Number(item.credit_value).toFixed(2)}
                            </Text>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                              <Text style={[styles.itemSubText, { color: "#dc2626" }]}>
                                Expires in {daysLeft} day(s)
                              </Text>
                              <Text style={styles.itemExpiryDate}>
                                {expiry.toDateString()}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* CONSOLIDATED REFERRAL CARD */}
          <View style={[styles.card, styles.referralCard]}>
            <View style={styles.cardHeader}>
              <Ionicons name="people-outline" size={24} color="#8b5cf6" />
              <Text style={styles.cardLabel}>Referrals & Rewards</Text>
            </View>

            <View style={styles.referralStats}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{referredUsersCount}</Text>
                <Text style={styles.statLabel}>Friends Referred</Text>
              </View>
              <View style={[styles.statBox, { borderLeftWidth: 1, borderLeftColor: "#f3f4f6" }]}>
                <Text style={[styles.statValue, { color: "#10b981" }]}>£{Number(referralCredits).toFixed(2)}</Text>
                <Text style={styles.statLabel}>Total Earned</Text>
              </View>
            </View>

            <View style={styles.referralCodeSection}>
              <Text style={styles.referLabel}>Your Referral Code</Text>
              <View style={styles.codeContainer}>
                <Text style={styles.referCodeText}>{user?.referral_code || "—"}</Text>
                <TouchableOpacity onPress={copyReferralCode} style={styles.inlineCopyBtn}>
                  <Ionicons name="copy-outline" size={18} color="#8b5cf6" />
                </TouchableOpacity>
              </View>
              <Text style={styles.referHint}>
                Share this code with friends and you both get rewarded when they place their first order!
              </Text>
            </View>

            {/* ACTION BUTTONS */}
            <View style={styles.referActionRow}>
              <TouchableOpacity
                onPress={shareReferralCode}
                style={styles.premiumShareBtn}
              >
                <Ionicons name="share-social-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.premiumShareText}>Share with Friends</Text>
              </TouchableOpacity>
            </View>
          </View>
          {false && (
            <View style={[styles.card, { marginTop: 12 }]}>
              <Text style={styles.cardLabel}>Redeem Loyalty</Text>

              <Text style={[styles.cardValue, { fontSize: 16 }]}>
                {Number(loyaltyRedeemPoints || 10)} pts = £{Number(loyaltyRedeemValue || 1).toFixed(2)}
              </Text>

              <Text style={styles.cardHint}>
                You can redeem {units} time(s) and get £{willGet.toFixed(2)}.
              </Text>

              <TouchableOpacity
                onPress={handleRedeem}
                disabled={redeeming || units <= 0}
                style={[
                  styles.redeemBtn,
                  (redeeming || units <= 0) && styles.redeemBtnDisabled,
                ]}
              >
                <Text style={styles.redeemBtnText}>
                  {redeeming ? "Redeeming..." : "Redeem to Wallet"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <Text style={styles.sectionTitle}>Recent Activity</Text>

          <View style={styles.historyBox}>
            {history.length === 0 ? (
              <Text style={{ padding: 14, color: "#6b7280", fontSize: 12 }}>
                No recent activity.
              </Text>
            ) : (
              history.map((item, idx) => (
                <View
                  key={item.id ?? idx}
                  style={[
                    styles.historyRow,
                    idx !== history.length - 1 && styles.historyRowBorder,
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyTitle}>
                      {item.title ?? item.description ?? "Transaction"}
                    </Text>

                    {!!(item.desc ?? item.note) && (
                      <Text style={styles.historyDesc}>{item.desc ?? item.note}</Text>
                    )}

                    {!!(item.date ?? item.created_at) && (
                      <Text style={styles.historyDate}>
                        {item.date ?? item.created_at}
                      </Text>
                    )}
                  </View>

                  <Text
                    style={[
                      styles.historyAmount,
                      String(item.amount ?? "").startsWith("-")
                        ? styles.negative
                        : styles.positive,
                    ]}
                  >
                    {item.amount ?? ""}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      <MenuModal
        visible={menuVisible}
        setVisible={setMenuVisible}
        user={user}
        navigation={navigation}
      />

      <BottomBar navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f9fafb" },
  content: { paddingHorizontal: 16, paddingBottom: 90, paddingTop: 16 },

  title: { fontSize: 24, fontWeight: "800", color: "#111827", marginBottom: 6 },
  subtitle: { fontSize: 13, color: "#6b7280", marginBottom: 20 },

  column: { gap: 16, marginBottom: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  walletCard: { borderLeftWidth: 4, borderLeftColor: "#10b981" },
  creditsCard: { borderLeftWidth: 4, borderLeftColor: "#3b82f6" },

  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 },
  cardLabel: { fontSize: 14, fontWeight: "600", color: "#4b5563" },
  cardValue: { fontSize: 28, fontWeight: "800", color: "#111827", marginBottom: 4 },
  cardHint: { fontSize: 12, color: "#9ca3af", marginTop: 4 },

  creditsRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  pointsSubText: { fontSize: 14, color: "#6b7280", fontWeight: "500" },

  // Dropdown Styles
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#f3f4f6",
  },
  dropdownTitle: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  dropdownContent: { marginTop: 4, paddingBottom: 4 },
  dropdownItem: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f3f4f6",
  },
  itemMainText: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 2 },
  itemSubText: { fontSize: 12, color: "#6b7280" },
  itemExpiryDate: { fontSize: 11, color: "#9ca3af" },

  // Referral Card Styles
  referralCard: { borderLeftWidth: 4, borderLeftColor: "#8b5cf6" },
  referralStats: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    marginVertical: 16,
    paddingVertical: 12,
  },
  statBox: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "800", color: "#111827" },
  statLabel: { fontSize: 11, color: "#6b7280", marginTop: 2 },

  referralCodeSection: { marginBottom: 16 },
  referLabel: { fontSize: 12, fontWeight: "600", color: "#6b7280", marginBottom: 6 },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "space-between",
  },
  referCodeText: { fontSize: 18, fontWeight: "700", color: "#111827", letterSpacing: 1 },
  inlineCopyBtn: { padding: 4 },
  referHint: { fontSize: 11, color: "#9ca3af", marginTop: 8, lineHeight: 16 },

  referActionRow: { marginTop: 8 },
  premiumShareBtn: {
    backgroundColor: "#28a745",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#28a745",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  premiumShareText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  // ✅ Pending points indication styles
  pendingTitle: { fontSize: 12, color: "#d97706", fontWeight: "700" },
  pendingDesc: { fontSize: 11, color: "#9ca3af", marginTop: 2 },

  sectionTitle: {
    marginTop: 24,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  historyBox: { backgroundColor: "#fff", borderRadius: 16, paddingHorizontal: 16, marginBottom: 20 },
  historyRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  historyRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#f3f4f6" },
  historyTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  historyDesc: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  historyDate: { fontSize: 11, color: "#9ca3af", marginTop: 4 },
  historyAmount: { fontSize: 14, fontWeight: "800", marginLeft: 8 },
  positive: { color: "#10b981" },
  negative: { color: "#ef4444" },
});
