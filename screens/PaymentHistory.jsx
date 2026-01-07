import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getPaymentHistory } from "../services/paymentService";
import AppHeader from "./AppHeader";
import MenuModal from "./MenuModal";
import BottomBar from "./BottomBar";
import { AuthRequiredInline } from "./AuthRequired";

export default function PaymentHistory({ navigation }) {
  const [data, setData] = useState([]);
  const [user, setUser] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchPayments = async ({ refresh = false } = {}) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      const stored = await AsyncStorage.getItem("user");
      if (!stored) {
        // no signed-in user -> don't call API
        setData([]);
        setError(null);
        return;
      }

      if (stored && !user) setUser(JSON.parse(stored));

      const res = await getPaymentHistory();

      // Accept common shapes and fall back safely
      if (res?.status === 1) {
        if (Array.isArray(res.data)) setData(res.data || []);
        else if (Array.isArray(res)) setData(res || []);
        else setData(res.data || []);
      } else {
        setData([]);
      }
    } catch (err) {
      console.warn("Payment history fetch error:", err);
      // Try to extract backend error message if available
      const errMsg = err?.response?.data?.message || err?.message || "Failed to load payment history";
      setError(errMsg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#f6f7fb" }}>
      {/* 🔥 SAME HEADER AS PRODUCTS */}
      <AppHeader
        user={user}
        navigation={navigation}
        cartItems={{}} // payment history doesn’t need cart badge
        onMenuPress={() => setMenuVisible(true)}
      />

      {!user ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <AuthRequiredInline onSignIn={() => navigation.replace("Login")} description={"Sign in to view your payment history and transactions."} />
        </View>
      ) : loading && data.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 }}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 12 }}>Loading payment history...</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, index) => String(item.id || item.transaction_id || item.order_no || index)}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          refreshing={refreshing}
          onRefresh={() => fetchPayments({ refresh: true })}
          ListEmptyComponent={() => (
            <View style={{ alignItems: "center", marginTop: 60 }}>
              <Text style={{ fontSize: 18, color: "#999", marginBottom: 8 }}>No payments yet</Text>
              {error ? (
                <>
                  <Text style={{ color: "#a00", marginBottom: 12 }}>{error}</Text>
                  <TouchableOpacity onPress={() => fetchPayments()} style={{ padding: 10, backgroundColor: "#16a34a", borderRadius: 8 }}>
                    <Text style={{ color: "#fff" }}>Retry</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          )}
          renderItem={({ item }) => {
            const date = item.created_at ? new Date(item.created_at) : null;
            const dateStr = date && !isNaN(date.getTime()) ? date.toLocaleString() : "";
            const currency = item.currency || "£";
            const amount = Number(item.amount || 0).toFixed(2);
            const status = (item.payment_status || "").toString().toLowerCase();
            let statusLabel = item.payment_status || "";
            if (status === "1" || status === "completed" || status === "paid") statusLabel = "Completed";
            else if (status === "failed" || status === "0") statusLabel = "Failed";
            else if (status === "pending") statusLabel = "Pending";

            return (
              <View style={styles.card}>
                <Text style={styles.order}>Order: {item.order_no || item.order_id || "-"}</Text>
                <Text>Status: {statusLabel}</Text>
                <Text>Amount: {currency}{amount}</Text>
                {item.transaction_id ? <Text>Txn: {item.transaction_id}</Text> : null}
                <Text style={styles.date}>{dateStr}</Text>
              </View>
            );
          }}
        />
      )}

      {/* SAME MENU + BOTTOM BAR */}
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
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 5,
    marginBottom: 12,
    elevation: 3,
  },
  order: {
    fontWeight: "700",
    marginBottom: 4,
    color: "#222",
  },
  date: {
    fontSize: 12,
    color: "#777",
    marginTop: 6,
  },
});
