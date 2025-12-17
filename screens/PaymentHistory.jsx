import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getPaymentHistory } from "../services/paymentService";
import AppHeader from "./AppHeader";
import MenuModal from "./MenuModal";
import BottomBar from "./BottomBar";

export default function PaymentHistory({ navigation }) {
  const [data, setData] = useState([]);
  const [user, setUser] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));

      const res = await getPaymentHistory();
      if (res?.status === 1) setData(res.data || []);
    })();
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

      <FlatList
        data={data}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.order}>Order: {item.order_no}</Text>
            <Text>Status: {item.payment_status}</Text>
            <Text>Amount: £{Number(item.amount).toFixed(2)}</Text>
            <Text style={styles.date}>
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </View>
        )}
      />

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
