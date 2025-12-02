// screens/Orders.jsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";

import AppHeader from "./AppHeader";
import BottomBar from "./BottomBar";
import MenuModal from "./MenuModal";

import { getOrders } from "../services/orderService";
import { getCart } from "../services/cartService";

export default function Orders({ navigation }) {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [cartItems, setCartItems] = useState({});

  const isFocused = useIsFocused();

  // Load user
  useEffect(() => {
    const loadUser = async () => {
      const stored = await AsyncStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
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
            if (qty > 0) {
              map[item.product_id] =
                (map[item.product_id] || 0) + qty;
            }
          });
          setCartItems(map);
        } else {
          setCartItems({});
        }
      } catch (err) {
        console.log("Cart fetch error (Orders):", err);
      }
    };

    if (isFocused && user) fetchCart();
  }, [isFocused, user]);

  // Fetch order history
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      const customerId = user.id ?? user.customer_id;
      if (!customerId) return;

      setLoading(true);
      try {
        const res = await getOrders(customerId);
        if (res && res.status === 1 && Array.isArray(res.data)) {
          setOrders(res.data);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.log("Orders fetch error:", err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    if (isFocused && user) fetchOrders();
  }, [isFocused, user]);

  const renderStatusChip = (status) => {
    const s = (status || "").toString().toLowerCase();
    let label = "Pending";
    let bg = "#fff7e0";
    let color = "#8a6d1f";

    if (s === "completed" || s === "delivered" || s === "1") {
      label = "Completed";
      bg = "#e5f7eb";
      color = "#20663b";
    } else if (s === "cancelled" || s === "canceled") {
      label = "Cancelled";
      bg = "#fbe4e6";
      color = "#8a1f2a";
    }

    return (
      <View style={[styles.statusChip, { backgroundColor: bg }]}>
        <Text style={[styles.statusText, { color }]}>{label}</Text>
      </View>
    );
  };

  const renderOrder = ({ item }) => {
    const orderId = item.order_id || item.id;
    const orderNo = item.order_no || `#${orderId}`;
    const createdAt = item.created_at || item.order_date;

    let dateStr = "";
    if (createdAt) {
      const d = new Date(createdAt);
      if (!isNaN(d.getTime())) dateStr = d.toLocaleString();
    }

    const total =
      item.total_amount ??
      item.grand_total ??
      item.amount ??
      item.net_amount ??
      0;
    const itemsCount =
      item.items_count || item.items?.length || item.item_count || 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name="receipt-outline"
              size={16}
              color="#28a745"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.orderNo}>{orderNo}</Text>
          </View>
          {renderStatusChip(item.status)}
        </View>

        {dateStr ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <Ionicons name="time-outline" size={14} color="#777" />
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>
        ) : null}

        <View style={styles.row}>
          <Text style={styles.labelText}>Items</Text>
          <Text style={styles.valueText}>{itemsCount}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.labelText}>Total</Text>
          <Text style={styles.totalText}>
            £ {Number(total).toFixed(2)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <AppHeader
        user={user}
        navigation={navigation}
        cartItems={cartItems}
        onMenuPress={() => setMenuVisible(true)}
      />

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centerBox}>
          <Ionicons name="receipt-outline" size={60} color="#d0d0d0" />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>
            Place an order and it will show up here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item, index) =>
            String(item.order_id || item.id || index)
          }
          renderItem={renderOrder}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }} // tighter bottom
          ListHeaderComponent={
            <View style={styles.headerRow}>
              <Ionicons
                name="bag-check-outline"
                size={20}
                color="#28a745"
              />
              <Text style={styles.headerTitle}>Your Orders</Text>
            </View>
          }
        />
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
  root: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  headerTitle: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },

  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "700",
    color: "#444",
  },
  emptySubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#777",
    textAlign: "center",
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 5,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    borderWidth: 0.4,
    borderColor: "#eeeeee",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  orderNo: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  dateText: {
    fontSize: 12,
    color: "#777",
    marginLeft: 4,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  labelText: {
    fontSize: 14,
    color: "#555",
  },
  valueText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  totalText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#28a745",
  },
});
