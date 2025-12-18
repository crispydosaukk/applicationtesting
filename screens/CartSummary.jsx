// CartSummary.js
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { RefreshControl, ScrollView } from "react-native";
import useRefresh from "../hooks/useRefresh";
import AppHeader from "./AppHeader";
import BottomBar from "./BottomBar";
import MenuModal from "./MenuModal";
import { getCart, addToCart, removeFromCart } from "../services/cartService";

export default function CartSummary({ navigation }) {
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState({});
  const [products, setProducts] = useState([]);
  const [updating, setUpdating] = useState({});
  const [loadingCart, setLoadingCart] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);

  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { refreshing, onRefresh } = useRefresh(async () => {
    await refreshCart();   // you already have this function 👌
  });

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    })();
  }, []);

  useEffect(() => {
    if (isFocused) {
      setLoadingCart(true);
      refreshCart();
    }
  }, [isFocused]);

  const refreshCart = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const customerId = parsedUser?.id ?? parsedUser?.customer_id;
      if (!customerId) return;

      const res = await getCart(customerId);
      if (res?.status === 1 && Array.isArray(res.data)) {
        // Remove any items with zero quantity so the cart UI doesn't show removed items
        const filtered = res.data.filter((i) => (i.product_quantity || 0) > 0);
        setProducts(filtered);
        const map = {};
        filtered.forEach((i) => {
          map[i.product_id] = i.product_quantity || 0;
        });
        setCartItems(map);
      } else {
        setProducts([]);
        setCartItems({});
      }
    } catch (e) {
      console.warn("Failed to refresh cart", e);
      setProducts([]);
      setCartItems({});
    } finally {
      setLoadingCart(false);
    }
  };

  const calcTotal = (price, qty) => (price * qty).toFixed(2);

  const grandTotal = products
    .reduce((sum, i) => {
      const price = Number(i.discount_price ?? i.product_price ?? 0);
      return sum + price * (i.product_quantity || 0);
    }, 0)
    .toFixed(2);

  const updateQty = async (item, delta) => {
    const current = cartItems[item.product_id] || 0;
    const updated = current + delta;

    const storedUser = await AsyncStorage.getItem("user");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    const customerId = parsedUser?.id ?? parsedUser?.customer_id;
    if (!customerId) return;

    // prevent double updates for the same product
    setUpdating((s) => ({ ...s, [item.product_id]: true }));
    try {
      if (updated <= 0) {
        // remove from server
        await removeFromCart(item.cart_id || item.id);

        // update local state
        setCartItems((prev) => {
          const next = { ...prev };
          delete next[item.product_id];
          return next;
        });

        setProducts((prev) => prev.filter((p) => p.product_id !== item.product_id));
      } else {
        // send delta to server
        await addToCart({
          customer_id: customerId,
          user_id: parsedUser.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_price: item.product_price,
          product_quantity: delta,
          textfield: item.textfield || "",
        });

        setCartItems((prev) => ({ ...prev, [item.product_id]: updated }));

        setProducts((prev) =>
          prev.map((p) =>
            p.product_id === item.product_id ? { ...p, product_quantity: updated } : p
          )
        );
      }
    } catch (e) {
      console.warn("Failed to update cart item", e);
    } finally {
      setUpdating((s) => {
        const next = { ...s };
        delete next[item.product_id];
        return next;
      });
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

      {/* Offer banner */}
      <View style={styles.offerBanner}>
        <Icon name="gift-outline" size={22} color="#ffffff" />
        <Text style={styles.offerText}>
          You’re earning rewards on this order 🎉
        </Text>
      </View>

      {loadingCart ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" />
        </View>
      ) : products.length < 1 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >

          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Add some tasty food and we’ll get it ready for you.
          </Text>
          <TouchableOpacity
            style={styles.startOrderBtn}
            onPress={() => navigation.navigate("Resturent")}
          >
            <Text style={styles.startOrderText}>Browse restaurants</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <>
          {/* ETA row */}
          <View style={styles.timeRow}>
            <Icon name="clock-outline" size={20} color="#1b5e20" />
            <Text style={styles.timeRowText}>
              Estimated preparation time{" "}
              <Text style={styles.timeHighlight}>20 mins</Text>
            </Text>
          </View>

          {/* Cart list */}
          <FlatList
            data={products}
            keyExtractor={(i) => String(i.product_id)}
            contentContainerStyle={{ padding: 16, paddingBottom: 200 }}
            renderItem={({ item }) => {
              const qty = item.product_quantity || 0;
              const price = Number(
                item.discount_price ?? item.product_price ?? 0
              );
              const total = calcTotal(price, qty);

              return (
                <View style={styles.itemCard}>
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.product_name}
                    </Text>
                    {item.textfield ? (
                      <Text style={styles.itemNote} numberOfLines={2}>
                        {item.textfield}
                      </Text>
                    ) : null}

                    <View style={styles.qtyRow}>
                      <TouchableOpacity
                        style={[
                          styles.qtyBtn,
                          { backgroundColor: qty === 1 ? "#e53935" : "#ff9800" },
                        ]}
                        onPress={() => updateQty(item, -1)}
                        disabled={!!updating[item.product_id]}
                      >
                        {updating[item.product_id] ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : qty === 1 ? (
                          <Icon name="trash-can-outline" size={18} color="#ffffff" />
                        ) : (
                          <Text style={styles.qtyBtnLabel}>-</Text>
                        )}
                      </TouchableOpacity>

                      <Text style={styles.qtyCount}>{qty}</Text>

                      <TouchableOpacity
                        style={[styles.qtyBtn, { backgroundColor: "#28a745" }]}
                        onPress={() => updateQty(item, 1)}
                        disabled={!!updating[item.product_id]}
                      >
                        {updating[item.product_id] ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.qtyBtnLabel}>+</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.itemTotal}>£{total}</Text>
                </View>
              );
            }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />

          {/* Grand total bar */}
          <View
            style={[
              styles.floatingBar,
              { bottom: 66 + insets.bottom + 8 }, // 66 = BottomBar height
            ]}
          >
            <View style={styles.floatingLeft}>
              <Text style={styles.floatLabel}>Grand total</Text>
              <Text style={styles.floatAmount}>£{grandTotal}</Text>
            </View>

            <TouchableOpacity
              style={styles.floatBtn}
              onPress={() => navigation.navigate("CheckoutScreen")}
            >
              <Text style={styles.floatBtnText}>Check Out</Text>
              <Icon name="chevron-right" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </>
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
    backgroundColor: "#f5f5f5",
  },

  offerBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2faa3f",
    padding: 12,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 5,
    elevation: 3,
  },
  offerText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
    flex: 1,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyEmoji: { fontSize: 72, marginBottom: 8 },
  emptyTitle: { fontSize: 22, fontWeight: "800", color: "#222222" },
  emptySubtitle: {
    fontSize: 14,
    color: "#666666",
    marginTop: 4,
    textAlign: "center",
  },
  startOrderBtn: {
    backgroundColor: "#28a745",
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 5,
    marginTop: 18,
  },
  startOrderText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    padding: 10,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 5,
    borderLeftWidth: 3,
    borderLeftColor: "#28a745",
  },
  timeRowText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#336633",
    flex: 1,
  },
  timeHighlight: {
    fontWeight: "800",
    color: "#1b5e20",
  },

  itemCard: {
    backgroundColor: "#ffffff",
    borderRadius: 5,
    padding: 14,
    marginVertical: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    elevation: 3,
  },
  itemLeft: {
    flex: 1,
    paddingRight: 10,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222222",
  },
  itemNote: {
    fontSize: 13,
    color: "#777777",
    marginTop: 4,
  },

  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyBtnLabel: {
    fontSize: 18,
    color: "#ffffff",
    fontWeight: "800",
    marginTop: -1,
  },
  qtyCount: {
    fontSize: 15,
    fontWeight: "700",
    marginHorizontal: 10,
  },

  itemTotal: {
    fontSize: 16,
    fontWeight: "800",
    alignSelf: "center",
    color: "#000000",
  },

  floatingBar: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  floatingLeft: {
    flexDirection: "column",
  },
  floatLabel: {
    fontSize: 12,
    color: "#666666",
    fontWeight: "600",
  },
  floatAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#28a745",
    marginTop: 2,
  },
  floatBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28a745",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 5,
  },
  floatBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    marginRight: 4,
  },
});
