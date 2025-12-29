// screens/Orders.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";

import AppHeader from "./AppHeader";
import { AuthRequiredInline } from "./AuthRequired";
import BottomBar from "./BottomBar";
import MenuModal from "./MenuModal";
import { Modal, ScrollView, Image } from "react-native";
import { useIsFocused, useFocusEffect } from "@react-navigation/native";
import { getOrders } from "../services/orderService";
import { getOrder } from "../services/orderService";
import { getCart } from "../services/cartService";

export default function Orders({ navigation, route }) {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  const isFocused = useIsFocused();
  const ORDER_STATUS = {
  0: { label: "Order Placed", color: "#8a6d1f" },
  1: { label: "Order Accepted", color: "#1565c0" },
  2: { label: "Order Rejected", color: "#c62828" },
  3: { label: "Ready for Pickup", color: "#5e35b1" },
  4: { label: "Delivered", color: "#20663b" },
  5: { label: "Cancelled", color: "#8a1f2a" }
};

 const getOrderUIState = (status, etaTime) => {
  const s = Number(status);

  // 🔴 FINAL STATES — no processing text allowed
  if (s === 4) return { state: "DELIVERED" };
  if (s === 2) return { state: "REJECTED" };
  if (s === 5) return { state: "CANCELLED" };

  // 🟢 READY
  if (s === 3) {
    return { state: "READY" };
  }

  // 🔵 ACCEPTED → show ETA countdown if exists
  if (s === 1 && etaTime) {
    const eta = new Date(etaTime.replace(" ", "T")).getTime();
    const now = Date.now();

    if (!isNaN(eta)) {
      const diffMin = Math.ceil((eta - now) / 60000);
      if (diffMin > 0) {
        return { state: "COUNTDOWN", minutes: diffMin };
      }
    }
  }

  // 🟡 DEFAULT SAFE STATE
  return { state: "PREPARING" };
};

useEffect(() => {
  if (!isFocused) return;

  const timer = setInterval(() => {
    fetchOrders(true);
  }, 60000);

  return () => clearInterval(timer);
}, [isFocused, fetchOrders]);


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

  const [refreshing, setRefreshing] = useState(false);

  // Fetch order history (exposed so we can pull-to-refresh)
  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (!user) return;
    const customerId = user.id ?? user.customer_id;
    if (!customerId) return;

    if (isRefresh) setRefreshing(true);
    else {
      // If we have orders already (from state) or cache, don't show full screen loader
      if (orders.length === 0) setLoading(true);
    }

    try {
      // if navigation passed a newOrderId, show it immediately if cached
      const newOrderId = route?.params?.newOrderId;
      if (newOrderId) {
        try {
          const cachedSingle = await AsyncStorage.getItem(`order_${newOrderId}`);
          if (cachedSingle) {
            const parsed = JSON.parse(cachedSingle);
            setOrders(prev => {
              // if already present, don't duplicate
              const exists = prev.find(o => (o.order_id || o.id) == (parsed.order_id || parsed.id));
              if (exists) return prev;
              return [parsed].concat(prev || []);
            });

            // also ensure it's in orders_cache
            try {
              const existing = await AsyncStorage.getItem("orders_cache");
              let arr = existing ? JSON.parse(existing) : [];
              arr = [parsed].concat(arr.filter(o => (o.order_id || o.id) !== (parsed.order_id || parsed.id)));
              await AsyncStorage.setItem("orders_cache", JSON.stringify(arr));
            } catch (e) {
              console.warn("Failed to update orders_cache with new order", e);
            }
          }
        } catch (e) {
          console.warn("Failed to read single cached order", e);
        }

        // clear the param so it doesn't re-trigger
        try {
          navigation.setParams({ newOrderId: undefined });
        } catch (e) { }
      }

      // show cached orders (if any) immediately
      let cachedArr = [];
      try {
        const cached = await AsyncStorage.getItem("orders_cache");
        if (cached) {
          cachedArr = JSON.parse(cached) || [];
          if (Array.isArray(cachedArr) && cachedArr.length > 0) {
            setOrders(cachedArr);
            setLoading(false); // ✅ Show instantly
          }
        }
      } catch (e) {
        console.warn("Failed to read orders cache", e);
      }

      // fetch fresh orders from server
      const res = await getOrders(customerId);

      // Accept multiple response shapes (backends vary): res.data (arr), res.orders (arr), res.data.data (arr)
      let fresh = null;
      if (res && res.status === 1) {
        if (Array.isArray(res.data)) fresh = res.data;
        else if (Array.isArray(res.orders)) fresh = res.orders;
        else if (Array.isArray(res.data?.data)) fresh = res.data.data;
      }

      if (fresh) {
        // If we had a cached "new" order (e.g. just created locally) ensure it remains
        // visible even if the server's fresh list doesn't include it yet. We assume the
        // most-recent locally cached order is at cachedArr[0]. If it's missing from
        // fresh, prepend it to preserve user feedback.
        if (Array.isArray(cachedArr) && cachedArr.length > 0) {
          const head = cachedArr[0];
          const headId = head && (head.order_id || head.id);
          if (headId) {
            const found = fresh.find(o => (o.order_id || o.id) == headId);
            if (!found) {
              fresh = [head].concat(fresh.filter(o => (o.order_id || o.id) !== headId));
            }
          }
        }

        setOrders(fresh);

        // update cache
        try {
          await AsyncStorage.setItem("orders_cache", JSON.stringify(fresh || []));
        } catch (e) {
          console.warn("Failed to update orders cache", e);
        }
      } else {
        // don't overwrite existing cached orders if the server returned an unexpected shape
        console.warn("Orders fetch returned unexpected shape or empty result:", res);
      }
    } catch (err) {
      console.log("Orders fetch error:", err);
      setOrders([]);
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, [user, route, navigation]);

  useFocusEffect(
  React.useCallback(() => {
    if (!global.lastOrderUpdate) return;

    const { order_number, status } = global.lastOrderUpdate;

    setOrders(prev =>
      prev.map(o =>
        (o.order_no === order_number || o.order_number === order_number)
          ? { ...o, status }
          : o
      )
    );

    // clear after applying
    global.lastOrderUpdate = null;
  }, [])
);


  useEffect(() => {
    if (isFocused && user) fetchOrders();
  }, [isFocused, user, fetchOrders]);

  const onRefresh = async () => {
    await fetchOrders(true);
  };

  const renderStatusChip = (status) => {
  const s = Number(status);
  const cfg = ORDER_STATUS[s] || { label: "Processing", color: "#555" };

  return (
    <View style={[styles.statusChip, { backgroundColor: "#f5f5f5" }]}>
      <Text style={[styles.statusText, { color: cfg.color }]}>
        {cfg.label}
      </Text>
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
      if (!isNaN(d.getTime())) {
        dateStr = d.toLocaleDateString("en-GB") + ", " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      }
    }

    const total =
      item.net_amount ??
      item.total_amount ??
      item.grand_total ??
      item.amount ??
      0;

    const itemsCount =
      item.items_count || item.items?.length || item.item_count || 0;

    return (
      <TouchableOpacity style={styles.card} onPress={() => openOrderDetails(orderId, item)}>
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
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {renderStatusChip(item.status)}
            <Ionicons
              name="eye-outline"
              size={18}
              color="#28a745"
              style={{ marginLeft: 8 }}
            />
          </View>
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
          <Text style={styles.labelText}>Grand Total</Text>
          <Text style={styles.totalText}>
            £{Number(total).toFixed(2)}
          </Text>
        </View>

       {(() => {
  const ui = getOrderUIState(item.status, item.delivery_estimate_time);

  switch (ui.state) {
    case "COUNTDOWN":
      return (
        <Text style={{ fontSize: 13, color: "#ff9800", fontWeight: "700", marginTop: 4 }}>
          ⏱ Estimated ready in {ui.minutes} min{ui.minutes > 1 ? "s" : ""}
        </Text>
      );

    case "PREPARING":
      return (
        <Text style={{ fontSize: 13, color: "#9e9e9e", fontWeight: "600", marginTop: 4 }}>
          ⏳ Your order is being prepared
        </Text>
      );

    case "READY":
      return (
        <Text style={{ fontSize: 13, color: "#4caf50", fontWeight: "800", marginTop: 4 }}>
          ✅ Order is ready for pickup
        </Text>
      );

    case "DELIVERED":
      return (
        <Text style={{ fontSize: 13, color: "#2e7d32", fontWeight: "800", marginTop: 4 }}>
          📦 Order delivered successfully
        </Text>
      );

    case "REJECTED":
      return (
        <Text style={{ fontSize: 13, color: "#c62828", fontWeight: "700", marginTop: 4 }}>
          ❌ Order was rejected
        </Text>
      );

    case "CANCELLED":
      return (
        <Text style={{ fontSize: 13, color: "#8a1f2a", fontWeight: "700", marginTop: 4 }}>
          ⚠️ Order cancelled
        </Text>
      );

    default:
      return null;
  }
})()}


      </TouchableOpacity>
    );
  };

  const openOrderDetails = async (orderId, item = null) => {
    setDetailsLoading(true);
    setDetailsVisible(true);

    try {
      // try cache first
      const key = `order_${orderId}`;
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        setOrderDetails(JSON.parse(cached));
        setDetailsLoading(false);
        // still refresh in background
        getOrder(orderId).then((res) => {
          if (res?.status === 1 && res.data) {
            AsyncStorage.setItem(key, JSON.stringify(res.data));
            setOrderDetails(res.data);
          }
        });
        return;
      }

      const res = await getOrder(orderId);
      if (res?.status === 1 && res.data) {
        setOrderDetails(res.data);
        await AsyncStorage.setItem(key, JSON.stringify(res.data));
      } else {
        // fallback: if getOrder didn't return details, try use existing summary from list
        setOrderDetails(item || null);
      }
    } catch (e) {
      console.warn("Failed to load order details", e);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setDetailsVisible(false);
    setOrderDetails(null);
    setDetailsLoading(false);
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
          <AuthRequiredInline onSignIn={() => navigation.replace("Login")} description={"Sign in to view your orders, order history and tracking."} />
        </View>
      ) : loading ? (
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
          refreshing={refreshing}
          onRefresh={onRefresh}
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
      {/* Order details modal */}
      <Modal visible={detailsVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}>
          <View style={{ flex: 1, backgroundColor: "#fff", marginTop: 80, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderColor: "#eee" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: "800" }}>{orderDetails?.order_no || "Order"}</Text>
                <TouchableOpacity onPress={closeDetails}><Text style={{ color: "#007AFF" }}>Close</Text></TouchableOpacity>
              </View>
              <Text style={{ color: "#666", marginTop: 6 }}>
                {orderDetails?.created_at || orderDetails?.order_date
                  ? new Date(orderDetails.created_at || orderDetails.order_date).toLocaleDateString("en-GB") + ", " + new Date(orderDetails.created_at || orderDetails.order_date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
                  : ""}
              </Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {detailsLoading ? (
                <ActivityIndicator size="large" />
              ) : orderDetails ? (
                <>
                  {/* Items */}
                  <Text style={{ fontWeight: "800", marginBottom: 8 }}>Items</Text>
                  {(orderDetails.items || orderDetails.order_items || orderDetails.products || []).length === 0 ? (
                    <Text style={{ color: "#666" }}>No item details available.</Text>
                  ) : (
                    (orderDetails.items || orderDetails.order_items || orderDetails.products || []).map((it, idx) => (
                      <View key={idx} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                        <Text style={{ flex: 1 }}>{it.name || it.product_name || it.title}</Text>
                        <Text style={{ marginLeft: 8 }}>x{it.quantity || it.quantity_ordered || it.product_quantity || 1}</Text>
                        <Text style={{ marginLeft: 12 }}>£{(Number(it.price || it.product_price || it.unit_price || 0) * (it.quantity || it.product_quantity || 1)).toFixed(2)}</Text>
                      </View>
                    ))
                  )}

                 {(() => {
  const ui = getOrderUIState(
    orderDetails?.status,
    orderDetails?.delivery_estimate_time
  );

  switch (ui.state) {
    case "COUNTDOWN":
      return (
        <Text style={{ fontSize: 13, color: "#ff9800", fontWeight: "700" }}>
          ⏱ Estimated ready in {ui.minutes} min{ui.minutes > 1 ? "s" : ""}
        </Text>
      );

    case "PREPARING":
      return (
        <Text style={{ fontSize: 13, color: "#9e9e9e", fontWeight: "600" }}>
          ⏳ Your order is being prepared
        </Text>
      );

    case "READY":
      return (
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#4caf50" }}>
          ✅ Order is ready for pickup
        </Text>
      );

    case "DELIVERED":
      return (
        <Text style={{ fontSize: 14, fontWeight: "800", color: "#2e7d32" }}>
          📦 Order delivered successfully
        </Text>
      );

    case "REJECTED":
      return (
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#c62828" }}>
          ❌ Order was rejected
        </Text>
      );

    case "CANCELLED":
      return (
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#8a1f2a" }}>
          ⚠️ Order cancelled
        </Text>
      );

    default:
      return null;
  }
})()}


                  {/* Address */}
                  {orderDetails.delivery_address || orderDetails.address ? (
                    <>
                      <Text style={{ fontWeight: "800", marginTop: 12 }}>Delivery</Text>
                      <Text style={{ color: "#333" }}>{orderDetails.delivery_address || orderDetails.address}</Text>
                    </>
                  ) : null}

                  {/* Payment */}
                  {orderDetails.payment_method || orderDetails.payment_type ? (
                    <>
                      <Text style={{ fontWeight: "800", marginTop: 12 }}>Payment</Text>
                      <Text style={{ color: "#333" }}>{orderDetails.payment_method || orderDetails.payment_type}</Text>
                    </>
                  ) : null}

                  {/* Totals */}
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ fontWeight: "800" }}>Summary</Text>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Items total</Text>
                      <Text>£{
                        // Calculate items total manually if main fields are missing
                        Number(
                          orderDetails.sub_total ||
                          orderDetails.items_total ||
                          orderDetails.total_items_price ||
                          (orderDetails.items || []).reduce((sum, i) => sum + (Number(i.price || i.product_price || 0) * (Number(i.quantity || i.product_quantity || 1))), 0)
                        ).toFixed(2)
                      }</Text>
                    </View>
                    {/* 
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Delivery</Text>
                      <Text>£{Number(orderDetails.delivery_charge || orderDetails.delivery_fee || 0).toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Tax</Text>
                      <Text>£{Number(orderDetails.tax || 0).toFixed(2)}</Text>
                    </View> 
                    */}
                    {(Number(orderDetails.wallet_used) > 0 || Number(orderDetails.wallet_deducted) > 0) && (
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Wallet Used</Text>
                        <Text style={{ color: "#e53935" }}>-£{Number(orderDetails.wallet_used || orderDetails.wallet_deducted).toFixed(2)}</Text>
                      </View>
                    )}
                    {(Number(orderDetails.loyalty_used) > 0) && (
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Loyalty Credits Used</Text>
                        <Text style={{ color: "#e53935" }}>-£{Number(orderDetails.loyalty_used).toFixed(2)}</Text>
                      </View>
                    )}
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Grand total</Text>
                      <Text style={styles.summaryTotal}>£{Number(orderDetails.net_amount || orderDetails.total_amount || orderDetails.grand_total || orderDetails.amount || 0).toFixed(2)}</Text>
                    </View>
                  </View>
                </>
              ) : (
                <Text style={{ color: "#666" }}>No details available for this order.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  summaryLabel: {
    color: "#666",
  },
  summaryTotal: {
    fontWeight: "800",
  },
});
