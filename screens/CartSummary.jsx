// CartSummary.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import AppHeader from "./AppHeader";
import BottomBar from "./BottomBar";
import MenuModal from "./MenuModal";
import { getCart, addToCart, removeFromCart } from "../services/cartService";

export default function CartSummary({ navigation }) {
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState({});
  const [products, setProducts] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);

  const isFocused = useIsFocused();

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    })();
  }, []);

  useEffect(() => {
    if (isFocused) refreshCart();
  }, [isFocused]);

  const refreshCart = async () => {
    const storedUser = await AsyncStorage.getItem("user");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    const customerId = parsedUser?.id ?? parsedUser?.customer_id;
    if (!customerId) return;

    const res = await getCart(customerId);

    if (res?.status === 1 && Array.isArray(res.data)) {
      setProducts(res.data);

      const map = {};
      res.data.forEach((i) => {
        map[i.product_id] = i.product_quantity || 0;
      });
      setCartItems(map);
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

    if (updated <= 0) {
      await removeFromCart(item.cart_id || item.id);

      const newCart = { ...cartItems };
      delete newCart[item.product_id];
      setCartItems(newCart);

      setProducts((prev) =>
        prev.filter((p) => p.product_id !== item.product_id)
      );
    } else {
      await addToCart({
        customer_id: customerId,
        user_id: parsedUser.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_price: item.product_price,
        product_quantity: delta,
        textfield: item.textfield || "",
      });

      setCartItems({ ...cartItems, [item.product_id]: updated });

      setProducts((prev) =>
        prev.map((p) =>
          p.product_id === item.product_id
            ? { ...p, product_quantity: updated }
            : p
        )
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <AppHeader
          user={user}
          navigation={navigation}
          cartItems={cartItems}
          onMenuPress={() => setMenuVisible(true)}
        />

        <View style={styles.offerBanner}>
          <Icon name="star-circle-outline" size={24} color="#ff9800" />
          <Text style={styles.offerText}>Save more with your order today!</Text>
        </View>

        {products.length < 1 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🛒</Text>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptySubtitle}>
              Add delicious food to your cart.
            </Text>
            <TouchableOpacity
              style={styles.startOrderBtn}
              onPress={() => navigation.navigate("Resturent")}
            >
              <Text style={styles.startOrderText}>Start Ordering</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.timeRow}>
              <Icon name="clock-outline" size={22} color="#28a745" />
              <Text style={styles.timeRowText}>
                Order ready in{" "}
                <Text style={styles.timeHighlight}>20 mins</Text>
              </Text>
            </View>

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
                      <Text style={styles.itemName}>{item.product_name}</Text>
                      {item.textfield ? (
                        <Text style={styles.itemNote}>{item.textfield}</Text>
                      ) : null}

                      <View style={styles.qtyRow}>
                        <TouchableOpacity
                          style={[
                            styles.qtyBtn,
                            {
                              backgroundColor:
                                qty === 1 ? "#e53935" : "#ff9800",
                            },
                          ]}
                          onPress={() => updateQty(item, -1)}
                        >
                          {qty === 1 ? (
                            <Icon
                              name="trash-can-outline"
                              size={20}
                              color="#fff"
                            />
                          ) : (
                            <Text style={styles.qtyBtnLabel}>-</Text>
                          )}
                        </TouchableOpacity>

                        <Text style={styles.qtyCount}>{qty}</Text>

                        <TouchableOpacity
                          style={[
                            styles.qtyBtn,
                            { backgroundColor: "#28a745" },
                          ]}
                          onPress={() => updateQty(item, 1)}
                        >
                          <Text style={styles.qtyBtnLabel}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={styles.itemTotal}>£{total}</Text>
                  </View>
                );
              }}
            />

            <View style={styles.floatingBar}>
              <View style={styles.floatingLeft}>
                <Text style={styles.floatLabel}>Grand Total</Text>
                <Text style={styles.floatAmount}>£{grandTotal}</Text>
              </View>

              <TouchableOpacity
                style={styles.floatBtn}
                onPress={() => navigation.navigate("CheckoutScreen")}
              >
                <Text style={styles.floatBtnText}>Proceed</Text>
                <Icon name="chevron-right" size={22} color="#fff" />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },

  offerBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff8e1",
    padding: 14,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 6,
    elevation: 2,
  },
  offerText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "700",
    color: "#ff6f00",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 80,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#333",
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#777",
    marginTop: 4,
  },
  startOrderBtn: {
    backgroundColor: "#28a745",
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 6,
    marginTop: 20,
  },
  startOrderText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: "#28a745",
  },
  timeRowText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#388e3c",
    flex: 1,
  },
  timeHighlight: {
    fontWeight: "800",
    color: "#1b5e20",
  },

  itemCard: {
    backgroundColor: "#fff",
    borderRadius: 6,
    padding: 16,
    marginVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    elevation: 3,
  },
  itemLeft: {
    flex: 1,
    paddingRight: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },
  itemNote: {
    fontSize: 13,
    color: "#777",
    marginTop: 4,
  },

  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyBtnLabel: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "800",
  },
  qtyCount: {
    fontSize: 16,
    fontWeight: "700",
    marginHorizontal: 8,
  },

  itemTotal: {
    fontSize: 17,
    fontWeight: "800",
    alignSelf: "center",
    color: "#000",
  },

  floatingBar: {
    position: "absolute",
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  floatingLeft: {
    flexDirection: "column",
  },
  floatLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  floatAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: "#28a745",
    marginTop: 2,
  },
  floatBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28a745",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  floatBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginRight: 6,
  },
});
