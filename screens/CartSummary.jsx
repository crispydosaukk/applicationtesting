import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppHeader from "./AppHeader";
import BottomBar from "./BottomBar";
import { logoutUser } from "../utils/authHelpers";
import { getCart, addToCart } from "../services/cartService";

export default function CartSummary({ navigation }) {
  const [user, setUser] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [products, setProducts] = useState([]);

  // Load stored user
  useEffect(() => {
    const loadUser = async () => {
      const stored = await AsyncStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    };
    loadUser();
  }, []);

  // Fetch cart from server on mount
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
        const cartMap = {};
        res.data.forEach((item) => {
          cartMap[String(item.product_id)] = item.product_quantity || 0;
        });
        setCartItems(cartMap);
      }
    } catch (err) {
      console.log("refreshCartFromServer error:", err);
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
    const newQty = (cartItems[product.product_id] || 0) + delta;
    if (newQty < 0) return;

    try {
      const storedUser = await AsyncStorage.getItem("user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const customerId = parsedUser?.id ?? parsedUser?.customer_id;
      if (!customerId) return;

      await addToCart({
        customer_id: customerId,
        user_id: parsedUser.id,
        product_id: product.product_id,
        product_name: product.product_name,
        product_price: product.product_price,
        product_quantity: delta, // send delta to update
        textfield: product.textfield || "",
      });

      const updatedCartItems = { ...cartItems, [product.product_id]: newQty };
      setCartItems(updatedCartItems);

      const updatedProducts = products.map((p) =>
        p.product_id === product.product_id ? { ...p, product_quantity: newQty } : p
      );
      setProducts(updatedProducts);
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
          const price = Number(item.discount_price ?? item.product_price ?? 0);
          const total = calculateTotal(price, qty);

          return (
            <View style={styles.card}>
              <View style={styles.cardContent}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{item.product_name}</Text>
                  {item.textfield ? (
                    <Text style={styles.productNote}>{item.textfield}</Text>
                  ) : null}
                  <View style={styles.qtyPriceRow}>
                    <View style={styles.qtyControls}>
                      <TouchableOpacity
                        style={[styles.qtyBtn, { backgroundColor: "#ff6f00" }]}
                        onPress={() => updateQuantity(item, -1)}
                      >
                        <Text style={styles.qtyBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{qty}</Text>
                      <TouchableOpacity
                        style={[styles.qtyBtn, { backgroundColor: "#28a745" }]}
                        onPress={() => updateQuantity(item, 1)}
                      >
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.priceText}>£{price.toFixed(2)}</Text>
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
              onPress={() =>
                navigation.navigate("Checkout", { cartItems, products })
              }
            >
              <Text style={styles.checkoutText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={{ padding: 16 }}
      />

      <Modal transparent visible={menuVisible} animationType="fade">
        <View style={{ flex: 1 }}>
          <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)} />
          <View style={styles.menuBox}>
            {user ? (
              <TouchableOpacity
                style={styles.menuBtn}
                onPress={() => {
                  setMenuVisible(false);
                  logoutUser(navigation);
                }}
              >
                <Text style={styles.menuText}>Logout</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.menuBtn}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.replace("Login");
                }}
              >
                <Text style={styles.menuText}>Sign In</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      <BottomBar navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  heading: { fontSize: 26, fontWeight: "800", color: "#222", marginVertical: 12 },
  divider: { height: 1, backgroundColor: "#e0e0e0", marginVertical: 12 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cardContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  productName: { fontSize: 18, fontWeight: "700", color: "#222" },
  productNote: { fontSize: 14, color: "#666", marginTop: 6 },
  qtyPriceRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
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
  grandTotalAmount: { fontSize: 20, fontWeight: "800", color: "#28a745" },

  checkoutButton: {
    backgroundColor: "#ff6f00",
    borderRadius: 16,
    paddingVertical: 18,
    marginTop: 24,
    alignItems: "center",
  },
  checkoutText: { color: "#fff", fontSize: 18, fontWeight: "700" },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },

  menuBox: {
    position: "absolute",
    top: 65,
    right: 15,
    width: 180,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 12,
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  menuBtn: { paddingVertical: 12, paddingHorizontal: 18 },
  menuText: { fontSize: 16, color: "#333", fontWeight: "600" },
});
