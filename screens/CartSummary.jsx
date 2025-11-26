// CartSummary.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
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
    const loadUser = async () => {
      const stored = await AsyncStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (isFocused) refreshCartFromServer();
  }, [isFocused]);

  const refreshCartFromServer = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const customerId = parsedUser?.id ?? parsedUser?.customer_id;
      if (!customerId) return;

      const res = await getCart(customerId);

      if (res && res.status === 1 && Array.isArray(res.data)) {
        setProducts(res.data);

        const map = {};
        res.data.forEach((item) => {
          map[item.product_id] = item.product_quantity || 0;
        });
        setCartItems(map);
      }
    } catch (err) {
      console.log("Cart load error:", err);
    }
  };

  const calculateTotal = (price, qty) => (price * qty).toFixed(2);

  const grandTotal = products
    .reduce((sum, item) => {
      const price = Number(item.discount_price ?? item.product_price ?? 0);
      return sum + price * (item.product_quantity || 0);
    }, 0)
    .toFixed(2);

  const updateQuantity = async (product, delta) => {
    const current = cartItems[product.product_id] || 0;
    const updated = current + delta;

    try {
      const storedUser = await AsyncStorage.getItem("user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const customerId = parsedUser?.id ?? parsedUser?.customer_id;

      if (!customerId) return;

      if (updated <= 0) {
        await removeFromCart(product.cart_id || product.id);

        const newCart = { ...cartItems };
        delete newCart[product.product_id];
        setCartItems(newCart);

        setProducts(products.filter((p) => p.product_id !== product.product_id));
      } else {
        await addToCart({
          customer_id: customerId,
          user_id: parsedUser.id,
          product_id: product.product_id,
          product_name: product.product_name,
          product_price: product.product_price,
          product_quantity: delta,
          textfield: product.textfield || "",
        });

        setCartItems({ ...cartItems, [product.product_id]: updated });

        setProducts(
          products.map((p) =>
            p.product_id === product.product_id
              ? { ...p, product_quantity: updated }
              : p
          )
        );
      }
    } catch (err) {
      console.log("updateQuantity error:", err);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        user={user}
        navigation={navigation}
        cartItems={cartItems}
        onMenuPress={() => setMenuVisible(true)}
      />

      {/* OFFER BANNER */}
      <View style={styles.offerBanner}>
        <Icon name="star-circle-outline" size={26} color="#ff9800" />
        <Text style={styles.offerText}>Save more with your order today!</Text>
      </View>

      {/* If Empty */}
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
          {/* TIME ROW */}
          <View style={styles.timeRow}>
            <Icon name="clock-outline" size={22} color="#28a745" />
            <Text style={styles.timeRowText}>
              Order ready for pickup in approx 20 mins
            </Text>
          </View>

          <FlatList
            data={products}
            keyExtractor={(item) => String(item.product_id)}
            contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
            renderItem={({ item }) => {
              const qty = item.product_quantity || 0;
              const price = Number(
                item.discount_price ?? item.product_price ?? 0
              );
              const total = calculateTotal(price, qty);

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
                          { backgroundColor: qty === 1 ? "#e53935" : "#ff9800" },
                        ]}
                        onPress={() => updateQuantity(item, -1)}
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
                        style={[styles.qtyBtn, { backgroundColor: "#28a745" }]}
                        onPress={() => updateQuantity(item, 1)}
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

          {/* GRAND TOTAL ROW PREMIUM */}
          <View style={styles.totalRow}>
            <View style={styles.totalLeft}>
              <Icon name="cash-multiple" size={24} color="#28a745" />
              <Text style={styles.totalLabel}>Grand Total</Text>
            </View>

            <Text style={styles.totalAmount}>£{grandTotal}</Text>
          </View>

          {/* BOTTOM CTA */}
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => navigation.navigate("CheckoutScreen")}
          >
            <Text style={styles.ctaText}>Proceed to Add Details</Text>
          </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: "#fafafa" },

  /* OFFER BANNER */
  offerBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff8e1",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#ffe0b2",
  },
  offerText: {
    marginLeft: 10,
    fontSize: 15,
    fontWeight: "700",
    color: "#ff6f00",
  },

  /* EMPTY CART UI */
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyEmoji: { fontSize: 80, marginBottom: 10 },
  emptyTitle: { fontSize: 26, fontWeight: "800", color: "#333" },
  emptySubtitle: { fontSize: 16, color: "#777", marginTop: 6 },

  startOrderBtn: {
    backgroundColor: "#3fbd33ff",
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 5,
    marginTop: 20,
  },
  startOrderText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  /* TIME ROW */
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    padding: 12,
    margin: 16,
    borderRadius: 10,
  },
  timeRowText: { marginLeft: 10, fontSize: 15, color: "#388e3c" },

  /* CART ITEM CARD */
  itemCard: {
    backgroundColor: "#fff",
    borderRadius: 5,
    padding: 16,
    marginVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    elevation: 3,
    shadowColor: "#000",
  },
  itemLeft: { flex: 1, paddingRight: 10 },
  itemName: { fontSize: 18, fontWeight: "700", color: "#222" },
  itemNote: { fontSize: 14, color: "#777", marginTop: 4 },

  qtyRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyBtnLabel: { fontSize: 20, color: "#fff", fontWeight: "800" },
  qtyCount: { fontSize: 17, fontWeight: "700", marginHorizontal: 8 },

  itemTotal: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    alignSelf: "center",
  },

  /* TOTAL ROW */
totalRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  backgroundColor: "#fff",
  paddingVertical: 18,
  paddingHorizontal: 20,
  marginHorizontal: 16,
  borderRadius: 5,
  elevation: 4,
  shadowColor: "#000",
  shadowOpacity: 0.1,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
  marginBottom: 70,
},

totalLeft: {
  flexDirection: "row",
  alignItems: "center",
},

totalLabel: {
  fontSize: 18,
  marginLeft: 10,
  fontWeight: "700",
  color: "#333",
},

totalAmount: {
  fontSize: 22,
  fontWeight: "800",
  color: "#28a745",
},


  /* CTA BUTTON */
  ctaButton: {
    backgroundColor: "#51b338ff",
    paddingVertical: 18,
    borderRadius: 0,
    alignItems: "center",
    width: "100%",
    position: "absolute",
    bottom: 70,
  },
  ctaText: { color: "#fff", fontSize: 18, fontWeight: "800" },
});
