import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppHeader from "./AppHeader";
import BottomBar from "./BottomBar";
import { getCart, addToCart, removeFromCart } from "../services/cartService";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function CartSummary({ navigation }) {
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState({});
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const loadUser = async () => {
      const stored = await AsyncStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    };
    loadUser();
  }, []);

  useEffect(() => {
    refreshCartFromServer();
  }, []);

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
        const cartItemId = product.cart_id || product.id;
        await removeFromCart(cartItemId);

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
      <AppHeader user={user} navigation={navigation} cartItems={cartItems} />

      {/* EMPTY CART UI */}
      {products.length < 1 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Looks like you haven't added anything yet.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.orderInfoInline}>
            <Text style={styles.orderNote}>
              Your order preparation time will be confirmed by the business —{" "}
            </Text>
            <Icon name="clock-outline" size={18} color="#28a745" />
            <Text style={styles.collectionTime}> Collection: 20 mins</Text>
          </View>

          <FlatList
            data={products}
            keyExtractor={(item) => String(item.product_id)}
            ListHeaderComponent={
              <>
                <Text style={styles.heading}>Your Cart</Text>
                <View style={styles.divider} />
              </>
            }
            renderItem={({ item }) => {
              const qty = item.product_quantity || 0;
              const price = Number(
                item.discount_price ?? item.product_price ?? 0
              );
              const total = calculateTotal(price, qty);

              return (
                <View style={styles.card}>
                  <View style={styles.cardContent}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName}>{item.product_name}</Text>

                      {item.textfield && (
                        <Text style={styles.productNote}>{item.textfield}</Text>
                      )}

                      <View style={styles.qtyPriceRow}>
                        <View style={styles.qtyControls}>
                          <TouchableOpacity
                            style={[
                              styles.qtyBtn,
                              {
                                backgroundColor:
                                  qty === 1 ? "#d32f2f" : "#ff6f00",
                              },
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
                              <Text style={styles.qtyBtnText}>-</Text>
                            )}
                          </TouchableOpacity>

                          <Text style={styles.qtyText}>{qty}</Text>

                          <TouchableOpacity
                            style={[
                              styles.qtyBtn,
                              { backgroundColor: "#28a745" },
                            ]}
                            onPress={() => updateQuantity(item, 1)}
                          >
                            <Text style={styles.qtyBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.priceText}>
                          £{price.toFixed(2)}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.totalText}>£{total}</Text>
                  </View>
                </View>
              );
            }}
            ListFooterComponent={
              <View style={{ marginTop: 20, marginBottom: 120 }}>
                <View style={styles.grandTotalContainer}>
                  <Text style={styles.grandTotalText}>Grand Total</Text>
                  <Text style={styles.grandTotalAmount}>£{grandTotal}</Text>
                </View>

                <TouchableOpacity
                  style={styles.checkoutButton}
                  onPress={() => navigation.navigate("CheckoutScreen")}
                >
                  <Text style={styles.checkoutText}>Proceed to Add details</Text>
                </TouchableOpacity>
              </View>
            }
            contentContainerStyle={{ padding: 16 }}
          />
        </>
      )}
      <BottomBar navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },

  /* EMPTY CART UI */
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyEmoji: { fontSize: 80, marginBottom: 10 },
  emptyTitle: { fontSize: 24, fontWeight: "800", color: "#333" },
  emptySubtitle: {
    fontSize: 16,
    color: "#777",
    marginTop: 6,
    marginBottom: 20,
  },
  browseButton: {
    backgroundColor: "#ff6f00",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  browseButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },

  heading: {
    fontSize: 26,
    fontWeight: "800",
    color: "#222",
    marginVertical: 12,
  },
  divider: { height: 1, backgroundColor: "#e0e0e0", marginVertical: 12 },

  orderInfoInline: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 6,
    marginTop: 16,
    marginBottom: -10,
    marginHorizontal: 16,
  },
  orderNote: { fontSize: 14, fontWeight: "500", color: "#333" },
  collectionTime: {
    fontSize: 14,
    fontWeight: "700",
    color: "#28a745",
    marginLeft: 4,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    elevation: 4,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  productName: { fontSize: 18, fontWeight: "700", color: "#222" },
  productNote: { fontSize: 14, color: "#666", marginTop: 6 },

  qtyPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  qtyControls: { flexDirection: "row", alignItems: "center" },

  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
  qtyBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  qtyText: { fontSize: 16, fontWeight: "700", color: "#222" },

  priceText: { fontSize: 16, fontWeight: "600", color: "#28a745" },
  totalText: { fontSize: 16, fontWeight: "700", color: "#000" },

  grandTotalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    padding: 18,
    backgroundColor: "#fff",
    borderRadius: 16,
    elevation: 4,
  },
  grandTotalText: { fontSize: 18, fontWeight: "700", color: "#222" },
  grandTotalAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: "#28a745",
  },

  checkoutButton: {
    backgroundColor: "#ff6f00",
    borderRadius: 16,
    paddingVertical: 18,
    marginTop: 24,
    alignItems: "center",
  },
  checkoutText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
