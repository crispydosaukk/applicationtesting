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
    0: { label: "Placed", color: "#f59e0b", icon: "paper-plane" }, // Amber
    1: { label: "Accepted", color: "#3b82f6", icon: "checkmark-circle" }, // Blue
    2: { label: "Rejected", color: "#ef4444", icon: "close-circle" }, // Red
    3: { label: "Ready", color: "#8b5cf6", icon: "gift" }, // Purple
    4: { label: "Delivered", color: "#16a34a", icon: "checkmark-done-circle" }, // Vibrant Green
    5: { label: "Cancelled", color: "#6b7280", icon: "ban" } // Gray
  };

  const getOrderUIState = (status, etaTime) => {
    const s = Number(status);
    if (s === 4) return { state: "DELIVERED" };
    if (s === 2) return { state: "REJECTED" };
    if (s === 5) return { state: "CANCELLED" };
    if (s === 3) return { state: "READY" };
    if (s === 1 && etaTime) {
      const eta = new Date(etaTime.replace(" ", "T")).getTime();
      const now = Date.now();
      if (!isNaN(eta)) {
        const diffMin = Math.ceil((eta - now) / 60000);
        if (diffMin > 0) return { state: "COUNTDOWN", minutes: diffMin };
      }
    }
    return { state: "PREPARING" };
  };

  useEffect(() => {
    if (!isFocused) return;
    const timer = setInterval(() => { fetchOrders(true); }, 60000);
    return () => clearInterval(timer);
  }, [isFocused]);

  useEffect(() => {
    const loadUser = async () => {
      const stored = await AsyncStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    };
    loadUser();
  }, []);

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
        } else setCartItems({});
      } catch (err) { console.log("Cart fetch error", err); }
    };
    if (isFocused && user) fetchCart();
  }, [isFocused, user]);

  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (!user) return;
    const customerId = user.id ?? user.customer_id;
    if (!customerId) return;
    if (isRefresh) setRefreshing(true);
    else if (orders.length === 0) setLoading(true);

    try {
      const newOrderId = route?.params?.newOrderId;
      if (newOrderId) {
        const cachedSingle = await AsyncStorage.getItem(`order_${newOrderId}`);
        if (cachedSingle) {
          const parsed = JSON.parse(cachedSingle);
          setOrders(prev => {
            const exists = prev.find(o => (o.order_id || o.id) == (parsed.order_id || parsed.id));
            if (exists) return prev;
            return [parsed].concat(prev || []);
          });
        }
        navigation.setParams({ newOrderId: undefined });
      }

      let cachedArr = [];
      const cached = await AsyncStorage.getItem("orders_cache");
      if (cached) {
        cachedArr = JSON.parse(cached) || [];
        if (cachedArr.length > 0) {
          cachedArr.sort((a, b) => new Date(b.created_at || b.order_date || 0) - new Date(a.created_at || a.order_date || 0));
          setOrders(cachedArr);
          setLoading(false);
        }
      }

      const res = await getOrders(customerId);
      let fresh = null;
      if (res && res.status === 1) {
        fresh = res.data || res.orders || res.data?.data;
      }
      if (fresh && Array.isArray(fresh)) {
        fresh.sort((a, b) => new Date(b.created_at || b.order_date || 0) - new Date(a.created_at || a.order_date || 0));
        setOrders(fresh);
        await AsyncStorage.setItem("orders_cache", JSON.stringify(fresh));
      }
    } catch (err) { console.log("Orders fetch error", err); }
    finally { setRefreshing(false); setLoading(false); }
  }, [user, route, navigation]);

  useFocusEffect(useCallback(() => {
    if (!global.lastOrderUpdate) return;
    const { order_number, status } = global.lastOrderUpdate;
    setOrders(prev => prev.map(o => (o.order_no === order_number || o.order_number === order_number) ? { ...o, status } : o));
    global.lastOrderUpdate = null;
  }, []));

  useEffect(() => { if (isFocused && user) fetchOrders(); }, [isFocused, user, fetchOrders]);

  const renderStatusChip = (status) => {
    const cfg = ORDER_STATUS[Number(status)] || { label: "Processing", color: "#555", icon: "sync" };
    return (
      <View style={[styles.statusChip, { backgroundColor: cfg.color + "15", flexDirection: 'row', alignItems: 'center' }]}>
        <Ionicons name={cfg.icon} size={13} color={cfg.color} style={{ marginRight: 4 }} />
        <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
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
    const total = item.net_amount ?? item.total_amount ?? item.grand_total ?? item.amount ?? 0;
    const itemsCount = item.items_count || item.items?.length || item.item_count || 0;

    const ui = getOrderUIState(item.status, item.delivery_estimate_time);

    return (
      <TouchableOpacity style={styles.card} onPress={() => openOrderDetails(orderId, item)}>
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="receipt-outline" size={16} color="#16a34a" style={{ marginRight: 6 }} />
            <Text style={styles.orderNo}>{orderNo}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {renderStatusChip(item.status)}
            <Ionicons name="eye-outline" size={18} color="#16a34a" style={{ marginLeft: 8 }} />
          </View>
        </View>

        {dateStr ? (
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
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
          <Text style={styles.totalText}>£{Number(total).toFixed(2)}</Text>
        </View>

        {ui.state === "COUNTDOWN" && (
          <View style={[styles.statusBadge, { backgroundColor: '#FFF9E5', borderColor: '#FFECB3' }]}>
            <Ionicons name="time" size={16} color="#f59e0b" style={{ marginRight: 8 }} />
            <Text style={[styles.statusBadgeText, { color: "#f59e0b" }]}>Estimated ready in {ui.minutes} min</Text>
          </View>
        )}
        {ui.state === "PREPARING" && (
          <View style={[styles.statusBadge, { backgroundColor: '#F5F5F5', borderColor: '#E0E0E0' }]}>
            <Ionicons name="restaurant" size={16} color="#9e9e9e" style={{ marginRight: 8 }} />
            <Text style={[styles.statusBadgeText, { color: "#9e9e9e" }]}>Your order is being prepared</Text>
          </View>
        )}
        {ui.state === "READY" && (
          <View style={[styles.statusBadge, { backgroundColor: '#F3E5F5', borderColor: '#E1BEE7' }]}>
            <Ionicons name="gift" size={16} color="#8b5cf6" style={{ marginRight: 8 }} />
            <Text style={[styles.statusBadgeText, { color: "#8b5cf6" }]}>Order is ready for pickup</Text>
          </View>
        )}
        {ui.state === "DELIVERED" && (
          <View style={[styles.statusBadge, { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' }]}>
            <Ionicons name="checkmark-done-circle" size={16} color="#16a34a" style={{ marginRight: 8 }} />
            <Text style={[styles.statusBadgeText, { color: "#16a34a" }]}>Order delivered successfully</Text>
          </View>
        )}
        {ui.state === "REJECTED" && (
          <View style={[styles.statusBadge, { backgroundColor: '#FFEBEE', borderColor: '#FFCDD2' }]}>
            <Ionicons name="close-circle" size={16} color="#ef4444" style={{ marginRight: 8 }} />
            <Text style={[styles.statusBadgeText, { color: "#ef4444" }]}>Order was rejected</Text>
          </View>
        )}
        {ui.state === "CANCELLED" && (
          <View style={[styles.statusBadge, { backgroundColor: '#F5F5F5', borderColor: '#E0E0E0' }]}>
            <Ionicons name="ban" size={16} color="#6b7280" style={{ marginRight: 8 }} />
            <Text style={[styles.statusBadgeText, { color: "#6b7280" }]}>Order cancelled</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const openOrderDetails = async (orderId, item = null) => {
    setDetailsLoading(true); setDetailsVisible(true);
    try {
      const key = `order_${orderId}`;
      const cached = await AsyncStorage.getItem(key);
      if (cached) { setOrderDetails(JSON.parse(cached)); setDetailsLoading(false); }
      const res = await getOrder(orderId);
      if (res?.status === 1 && res.data) {
        setOrderDetails(res.data);
        await AsyncStorage.setItem(key, JSON.stringify(res.data));
      } else if (!orderDetails) setOrderDetails(item);
    } catch (e) { console.warn(e); } finally { setDetailsLoading(false); }
  };

  return (
    <View style={styles.root}>
      <AppHeader user={user} navigation={navigation} cartItems={cartItems} onMenuPress={() => setMenuVisible(true)} />
      {!user ? (
        <View style={styles.centerBox}><AuthRequiredInline onSignIn={() => navigation.replace("Login")} description={"Sign in to view your orders."} /></View>
      ) : loading ? (
        <View style={styles.centerBox}><ActivityIndicator size="large" /><Text style={styles.loadingText}>Loading orders...</Text></View>
      ) : orders.length === 0 ? (
        <View style={styles.centerBox}><Ionicons name="receipt-outline" size={60} color="#d0d0d0" /><Text style={styles.emptyTitle}>No orders yet</Text></View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item, index) => String(item.order_id || item.id || index)}
          renderItem={renderOrder}
          refreshing={refreshing}
          onRefresh={() => fetchOrders(true)}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          ListHeaderComponent={<View style={styles.headerRow}><Ionicons name="bag-check-outline" size={20} color="#16a34a" /><Text style={styles.headerTitle}>Your Orders</Text></View>}
        />
      )}
      <MenuModal visible={menuVisible} setVisible={setMenuVisible} user={user} navigation={navigation} />
      <Modal visible={detailsVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}>
          <View style={{ flex: 1, backgroundColor: "#fff", marginTop: 80, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderColor: "#eee", flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: "800" }}>{orderDetails?.order_no || "Order Details"}</Text>
              <TouchableOpacity onPress={() => setDetailsVisible(false)}><Text style={{ color: "#007AFF" }}>Close</Text></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {detailsLoading ? <ActivityIndicator size="large" /> : orderDetails ? (
                <>
                  <Text style={{ fontWeight: "800", marginBottom: 8 }}>Items</Text>
                  {(orderDetails.items || orderDetails.order_items || orderDetails.products || []).map((it, idx) => (
                    <View key={idx} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                      <Text style={{ flex: 1 }}>{it.name || it.product_name}</Text>
                      <Text>x{it.quantity || it.product_quantity}</Text>
                      <Text style={{ marginLeft: 12 }}>£{(Number(it.price || it.product_price) * (it.quantity || it.product_quantity)).toFixed(2)}</Text>
                    </View>
                  ))}
                  <View style={{ marginTop: 16, borderTopWidth: 1, borderColor: '#eee', paddingTop: 16 }}>
                    <View style={styles.summaryRow}><Text>Subtotal</Text><Text>£{Number(orderDetails.sub_total || 0).toFixed(2)}</Text></View>
                    <View style={styles.summaryRow}><Text style={{ fontWeight: '800' }}>Grand Total</Text><Text style={{ fontWeight: '800' }}>£{Number(orderDetails.net_amount || 0).toFixed(2)}</Text></View>
                  </View>
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <BottomBar navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  headerTitle: { marginLeft: 8, fontSize: 18, fontWeight: "700", color: "#222" },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 30 },
  loadingText: { marginTop: 10, fontSize: 14, color: "#666" },
  emptyTitle: { marginTop: 12, fontSize: 20, fontWeight: "700", color: "#444" },
  card: { backgroundColor: "#ffffff", borderRadius: 10, padding: 16, marginBottom: 12, elevation: 3, borderWidth: 1, borderColor: "#f0f0f0" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  orderNo: { fontSize: 15, fontWeight: "700", color: "#222" },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontFamily: 'PoppinsBold' },
  dateText: { fontSize: 12, color: "#777", marginLeft: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  labelText: { fontSize: 14, color: "#666", fontFamily: 'PoppinsMedium' },
  valueText: { fontSize: 14, fontWeight: "600", color: "#333" },
  totalText: { fontSize: 16, fontWeight: "800", color: "#16a34a" },
  statusBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  statusBadgeText: { fontSize: 13, fontFamily: 'PoppinsBold' },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
});
