// screens/Credits/index.jsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
      Alert.alert("Not enough points", `You need at least ${need} points to redeem.`);
      return;
    }

    try {
      setRedeeming(true);

      const res = await redeemLoyaltyToWallet();

      if (res?.status === 1) {
        Alert.alert(
          "Redeemed Successfully",
          `Converted ${res.points_redeemed} points to £${Number(res.wallet_amount).toFixed(2)}`
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

  // Fetch credits whenever screen is focused
  useEffect(() => {
    if (isFocused) loadCreditsData();
  }, [isFocused]);

  // Display helpers
  const units = Math.floor(
    Number(loyaltyPoints || 0) / Number(loyaltyRedeemPoints || 10)
  );
  const willGet = Number((units * Number(loyaltyRedeemValue || 1)).toFixed(2));

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

      {!user ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <AuthRequiredInline onSignIn={() => navigation.replace("Login")} description={"Sign in to view your wallet, referral rewards and loyalty details."} />
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
          Track your wallet, loyalty points & referral rewards.
        </Text>

        <View style={styles.row}>
          <View style={[styles.card, styles.walletCard]}>
            <Text style={styles.cardLabel}>Wallet Balance</Text>
            <Text style={styles.cardValue}>
              {walletBalance !== null ? `£${Number(walletBalance).toFixed(2)}` : "—"}
            </Text>
            <Text style={styles.cardHint}>Use this amount at checkout.</Text>
          </View>

          <View style={[styles.card, styles.pointsCard]}>
            <Text style={styles.cardLabel}>Loyalty Credits</Text>

          <Text style={styles.cardValue}>
            £{totalLoyaltyValue.toFixed(2)}
          </Text>

          <Text style={styles.cardHint}>
            {loyaltyPoints} points available • Auto-applied at checkout
          </Text>

            {/* ✅ NEW: Pending points indication */}
            {pendingLoyaltyPoints > 0 && (
              <View style={{ marginTop: 6 }}>
                <Text style={styles.pendingTitle}>
                  🎉 {pendingLoyaltyPoints} points earned!
                </Text>
                <Text style={styles.pendingDesc}>
                  Redeem available after {availableAfterHours} hour(s).
                </Text>
              </View>
            )}
            {pendingLoyaltyList.length > 0 && (
            <View style={[styles.card, { marginTop: 12 }]}>
              <Text style={styles.cardLabel}>Pending Loyalty Points</Text>

              {pendingLoyaltyList.map((item, idx) => {
                const unlockAt = new Date(item.available_from);
                const hoursLeft = Math.max(
                  0,
                  Math.ceil((unlockAt.getTime() - Date.now()) / (1000 * 60 * 60))
                );

                return (
                  <View
                    key={item.id || idx}
                    style={{
                      paddingVertical: 8,
                      borderBottomWidth:
                        idx !== pendingLoyaltyList.length - 1 ? StyleSheet.hairlineWidth : 0,
                      borderBottomColor: "#e5e7eb",
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#111827" }}>
                      {item.points_remaining} pts = £{Number(item.credit_value).toFixed(2)}
                    </Text>

                    <Text style={{ fontSize: 11, color: "#6b7280" }}>
                      Unlocks in {hoursLeft} hour(s)
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {loyaltyExpiryList.length > 0 && (
            <View style={[styles.card, { marginTop: 12 }]}>
              <Text style={styles.cardLabel}>Loyalty Expiry</Text>

              {loyaltyExpiryList.map((item, idx) => {
                const expiry = new Date(item.expires_at);
                const daysLeft = Math.max(
                  0,
                  Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                );

                return (
                  <View
                    key={item.id || idx}
                    style={{
                      paddingVertical: 8,
                      borderBottomWidth:
                        idx !== loyaltyExpiryList.length - 1
                          ? StyleSheet.hairlineWidth
                          : 0,
                      borderBottomColor: "#e5e7eb",
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600" }}>
                      {item.points_remaining} pts = £{Number(item.credit_value).toFixed(2)}
                    </Text>
                    <Text style={{ fontSize: 11, color: "#dc2626" }}>
                      Expires in {daysLeft} day(s)
                    </Text>

                    <Text style={{ fontSize: 10, color: "#9ca3af" }}>
                      Expiry on {expiry.toDateString()}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Referrals</Text>

          <Text style={styles.cardValue}>
            {referredUsersCount} user{referredUsersCount === 1 ? "" : "s"}
          </Text>

          <Text style={styles.cardHint}>
            {referredUsersCount} referred • £{Number(referralCredits).toFixed(2)} earned
          </Text>

        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Refer & Earn</Text>

          {/* Referral Code */}
          <Text style={[styles.cardValue, { letterSpacing: 1 }]}>
            {user?.referral_code || "—"}
          </Text>

          <Text style={styles.cardHint}>
            Share your referral code and earn rewards when friends place orders.
          </Text>

          {/* ACTION BUTTONS */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <TouchableOpacity
              onPress={copyReferralCode}
              style={[styles.refBtn, styles.copyBtn]}
            >
              <Text style={styles.refBtnText}>Copy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={shareReferralCode}
              style={[styles.refBtn, styles.shareBtn]}
            >
              <Text style={styles.refBtnText}>Share</Text>
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
  root: { flex: 1, backgroundColor: "#ffffff" },
  content: { paddingHorizontal: 16, paddingBottom: 90, paddingTop: 16 },

  title: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 4 },
  subtitle: { fontSize: 13, color: "#6b7280", marginBottom: 16 },

  row: { flexDirection: "row", gap: 12, marginBottom: 12 },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  walletCard: { borderLeftWidth: 3, borderLeftColor: "#10b981" },
  pointsCard: { borderLeftWidth: 3, borderLeftColor: "#3b82f6" },

  cardLabel: { fontSize: 12, color: "#6b7280", marginBottom: 4 },
  cardValue: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 4 },
  cardHint: { fontSize: 11, color: "#9ca3af" },

  // ✅ Pending points indication styles
  pendingTitle: { fontSize: 11, color: "#f59e0b", fontWeight: "700" },
  pendingDesc: { fontSize: 11, color: "#9ca3af", marginTop: 2 },

  redeemBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#111827",
    alignItems: "center",
  },
  redeemBtnDisabled: { opacity: 0.5 },
  redeemBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  sectionTitle: {
    marginTop: 18,
    marginBottom: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  refBtn: {
  flex: 1,
  paddingVertical: 10,
  borderRadius: 8,
  alignItems: "center",
},

copyBtn: {
  backgroundColor: "#e5e7eb",
},

shareBtn: {
  backgroundColor: "#28a745",
},

refBtnText: {
  fontSize: 13,
  fontWeight: "700",
  color: "#111827",
},

  historyBox: { backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 12 },
  historyRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  historyRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e7eb" },
  historyTitle: { fontSize: 13, fontWeight: "600", color: "#111827" },
  historyDesc: { fontSize: 11, color: "#6b7280" },
  historyDate: { fontSize: 10, color: "#9ca3af", marginTop: 2 },
  historyAmount: { fontSize: 13, fontWeight: "700", marginLeft: 8 },
  positive: { color: "#16a34a" },
  negative: { color: "#dc2626" },
});
