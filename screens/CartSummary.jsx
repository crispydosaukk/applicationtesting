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
import { getCart } from "../services/cartService";

export default function CartSummary({ route, navigation }) {
  const routeCollectionType = route.params?.collectionType ?? null;
  const routeKerbsideDetails =
    route.params?.kerbsideDetails ?? { carColor: "", carRegNumber: "", carOwner: "" };
  const routeAllergyNotes = route.params?.allergyNotes ?? "";

  const [user, setUser] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const [cartItems, setCartItems] = useState({});
  const [products, setProducts] = useState([]);
  const [collectionType, setCollectionType] = useState(routeCollectionType);
  const [kerbsideDetails, setKerbsideDetails] = useState(routeKerbsideDetails);
  const [allergyNotes, setAllergyNotes] = useState(routeAllergyNotes);

  const LOCAL_CART_KEY = "local_cart";

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
      const customerId = route.params?.customerId ?? parsedUser?.id ?? parsedUser?.customer_id;

      if (!customerId) {
        loadLocalCacheFallback();
        return;
      }

      const res = await getCart(customerId);
      if (res && res.status === 1 && Array.isArray(res.data)) {
        // Server returns full product info
        setProducts(res.data);

        // Create cartItems map
        const cartMap = {};
        res.data.forEach((item) => {
          cartMap[String(item.product_id)] = item.product_quantity || 0;
        });
        setCartItems(cartMap);

        // Save to local cache
        await AsyncStorage.setItem(
          LOCAL_CART_KEY,
          JSON.stringify({ cartItems: cartMap, products: res.data })
        );
      } else {
        loadLocalCacheFallback();
      }
    } catch (err) {
      console.log("refreshCartFromServer error:", err);
      loadLocalCacheFallback();
    }
  };

  const loadLocalCacheFallback = async () => {
    try {
      const cached = await AsyncStorage.getItem(LOCAL_CART_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setCartItems(parsed.cartItems || {});
        setProducts(parsed.products || []);
      }
    } catch (err) {
      console.log("loadLocalCacheFallback error:", err);
      setCartItems({});
      setProducts([]);
    }
  };

  const calculateTotal = (price, qty) => (price * qty).toFixed(2);

  const grandTotal = products
    .reduce((sum, item) => {
      const price = Number(item.discount_price ?? item.product_price ?? 0);
      return sum + price * (item.product_quantity || 0);
    }, 0)
    .toFixed(2);

  return (
    <View style={styles.container}>
      <AppHeader
        user={user}
        navigation={navigation}
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
                  <Text style={styles.productNote}>{item.textfield ?? ""}</Text>
                  <View style={styles.qtyPriceRow}>
                    <Text style={styles.qtyText}>Qty: {qty}</Text>
                    <Text style={styles.priceText}>£{price.toFixed(2)}</Text>
                  </View>
                </View>
                <Text style={styles.totalText}>£{total}</Text>
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          <View style={{ marginTop: 20, marginBottom: 100 }}>
            <View style={styles.divider} />

            {/* Collection Type */}
            <Text style={styles.subHeading}>Collection Type</Text>
            <View style={styles.collectionCard}>
              <Text style={styles.collectionText}>
                {collectionType === "kerbside" ? "Kerbside Pickup" : "In Store Pickup"}
              </Text>
              {collectionType === "kerbside" && (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.collectionText}>
                    Car Color: {kerbsideDetails.carColor}
                  </Text>
                  <Text style={styles.collectionText}>
                    Reg No: {kerbsideDetails.carRegNumber}
                  </Text>
                  <Text style={styles.collectionText}>
                    Owner: {kerbsideDetails.carOwner}
                  </Text>
                </View>
              )}
            </View>

            {/* Allergy Notes */}
            {allergyNotes ? (
              <View style={[styles.collectionCard, { marginTop: 12 }]}>
                <Text style={styles.subHeading}>Allergy / Dietary Notes</Text>
                <Text style={styles.collectionText}>{allergyNotes}</Text>
              </View>
            ) : null}

            {/* Grand Total */}
            <View style={styles.grandTotalContainer}>
              <Text style={styles.grandTotalText}>Grand Total</Text>
              <Text style={styles.grandTotalAmount}>£{grandTotal}</Text>
            </View>

            {/* Checkout Button */}
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() =>
                navigation.navigate("Checkout", {
                  cartItems,
                  products,
                  collectionType,
                  kerbsideDetails,
                  allergyNotes,
                })
              }
            >
              <Text style={styles.checkoutText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={{ padding: 16 }}
      />

      {/* Menu Modal */}
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
  heading: { fontSize: 24, fontWeight: "700", color: "#222", marginVertical: 12 },
  subHeading: { fontSize: 16, fontWeight: "600", color: "#333" },
  divider: { height: 1, backgroundColor: "#e0e0e0", marginVertical: 12 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  productName: { fontSize: 16, fontWeight: "700", color: "#222" },
  productNote: { fontSize: 14, color: "#666", marginTop: 4 },
  qtyPriceRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  qtyText: { fontSize: 14, fontWeight: "600", color: "#555" },
  priceText: { fontSize: 14, fontWeight: "600", color: "#28a745" },
  totalText: { fontSize: 16, fontWeight: "700", color: "#000" },

  collectionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginTop: 8,
  },
  collectionText: { fontSize: 14, color: "#555", marginTop: 2 },

  grandTotalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 3,
  },
  grandTotalText: { fontSize: 16, fontWeight: "700", color: "#222" },
  grandTotalAmount: { fontSize: 18, fontWeight: "700", color: "#28a745" },

  checkoutButton: {
    backgroundColor: "#ff6f00",
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 20,
    alignItems: "center",
  },
  checkoutText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },

  menuBox: {
    position: "absolute",
    top: 65,
    right: 15,
    width: 160,
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
