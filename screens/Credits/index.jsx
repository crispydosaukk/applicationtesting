// screens/Credits/index.jsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomBar from "../BottomBar.jsx";
import api from "../../config/api"; // 👈 path from Credits to config/api
import AsyncStorage from "@react-native-async-storage/async-storage";


export default function CreditsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  // 🔹 State variables (dynamic)
  const [walletBalance, setWalletBalance] = useState(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState(null);
  const [referralCredits, setReferralCredits] = useState(null);
  const [history, setHistory] = useState([]);

  // 🔹 You will fetch from API here
  useEffect(() => {
    loadCreditsData();
  }, []);

 const loadCreditsData = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      console.log("No token found, user not logged in");
      return;
    }

    const res = await api.get("/wallet/summary", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = res.data || {};

    setWalletBalance(
      typeof data.wallet_balance === "number"
        ? data.wallet_balance
        : Number(data.wallet_balance || 0)
    );

    setLoyaltyPoints(data.loyalty_points ?? 0);

    setReferralCredits(
      typeof data.referral_credits === "number"
        ? data.referral_credits
        : Number(data.referral_credits || 0)
    );

    setHistory(Array.isArray(data.history) ? data.history : []);
  } catch (err) {
    console.error(
      "Failed to load credits:",
      err.response?.data || err.message
    );
  }
};


  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <Text style={styles.title}>Credits & Wallet</Text>
        <Text style={styles.subtitle}>Track your wallet, loyalty points & referral rewards.</Text>

        {/* SUMMARY CARDS */}
        <View style={styles.row}>
          <View style={[styles.card, styles.walletCard]}>
            <Text style={styles.cardLabel}>Wallet Balance</Text>
            <Text style={styles.cardValue}>
              {walletBalance !== null ? `£${walletBalance.toFixed(2)}` : "—"}
            </Text>

            <Text style={styles.cardHint}>Use this amount at checkout.</Text>
          </View>

          <View style={[styles.card, styles.pointsCard]}>
            <Text style={styles.cardLabel}>Loyalty Points</Text>
            <Text style={styles.cardValue}>
              {loyaltyPoints !== null ? loyaltyPoints : "—"}
            </Text>
            <Text style={styles.cardHint}>Points earned from orders.</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Referral Credits</Text>
          <Text style={styles.cardValue}>
            {referralCredits !== null ? referralCredits : "—"}
          </Text>
          <Text style={styles.cardHint}>Earn rewards when your referrals order.</Text>
        </View>

        {/* HISTORY */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>

        <View style={styles.historyBox}>
          {history.length === 0 ? (
            <Text style={{ padding: 14, color: "#6b7280", fontSize: 12 }}>
              No recent activity.
            </Text>
          ) : (
            history.map((item, idx) => (
              <View
                key={item.id}
                style={[
                  styles.historyRow,
                  idx !== history.length - 1 && styles.historyRowBorder,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyTitle}>{item.title}</Text>
                  <Text style={styles.historyDesc}>{item.desc}</Text>
                  <Text style={styles.historyDate}>{item.date}</Text>
                </View>

                <Text
                  style={[
                    styles.historyAmount,
                    item.amount?.startsWith("-") ? styles.negative : styles.positive,
                  ]}
                >
                  {item.amount}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <BottomBar navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f5f7fb",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 90,
    paddingTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
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
  walletCard: {
    borderLeftWidth: 3,
    borderLeftColor: "#10b981",
  },
  pointsCard: {
    borderLeftWidth: 3,
    borderLeftColor: "#3b82f6",
  },
  cardLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  cardHint: {
    fontSize: 11,
    color: "#9ca3af",
  },
  sectionTitle: {
    marginTop: 18,
    marginBottom: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  historyBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  historyRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  historyDesc: {
    fontSize: 11,
    color: "#6b7280",
  },
  historyDate: {
    fontSize: 10,
    color: "#9ca3af",
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 8,
  },
  positive: {
    color: "#16a34a",
  },
  negative: {
    color: "#dc2626",
  },
});
