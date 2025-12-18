// CheckoutScreen.js
import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useIsFocused } from "@react-navigation/native";
import { RefreshControl } from "react-native";
import useRefresh from "../hooks/useRefresh";

import AppHeader from "./AppHeader";
import BottomBar from "./BottomBar";
import MenuModal from "./MenuModal";
import { getCart } from "../services/cartService";
import { createOrder } from "../services/orderService";
import { getWalletSummary } from "../services/walletService";
import { useStripe } from "@stripe/stripe-react-native";
import { API_BASE_URL } from "../config/baseURL";

export default function CheckoutScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);

  const [deliveryPopup, setDeliveryPopup] = useState(true);
  const [allergyPopup, setAllergyPopup] = useState(false);

  const [deliveryMethod, setDeliveryMethod] = useState(null);
  const [kerbsideName, setKerbsideName] = useState("");
  const [kerbsideColor, setKerbsideColor] = useState("");
  const [kerbsideReg, setKerbsideReg] = useState("");
  const [allergyNote, setAllergyNote] = useState("");

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [walletUsed, setWalletUsed] = useState(0);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [processingPayment, setProcessingPayment] = useState(false);

  const isFocused = useIsFocused();

  // map for cart badge in header
  const cartItemsMap = useMemo(() => {
    const map = {};
    cart.forEach((item) => {
      const qty = item.product_quantity || 0;
      if (qty > 0) map[item.product_id] = qty;
    });
    return map;
  }, [cart]);

  // only show items with quantity > 0 in checkout
  const visibleCart = useMemo(() => {
    return (cart || []).filter((i) => (i.product_quantity || 0) > 0);
  }, [cart]);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    })();
  }, []);

  useEffect(() => {
    if (!user || !isFocused) return;
    (async () => {
      const cid = user.id ?? user.customer_id;
      const res = await getCart(cid);
      if (res?.status === 1) setCart(res.data || []);
    })();
  }, [user, isFocused]);


const getCartTotal = () => {
  return cart.reduce((sum, item) => {
    const p = Number(item.discount_price ?? item.product_price ?? 0);
    return sum + p * (item.product_quantity || 0);
  }, 0);
};

const getFinalTotal = () => {
  const total = getCartTotal();
  return Math.max(0, total - (useWallet ? walletUsed : 0));
};


  const continueDeliverySelection = () => {
    if (!deliveryMethod) {
      alert("Please select a delivery method.");
      return;
    }

    if (
      deliveryMethod === "kerbside" &&
      (!kerbsideName || !kerbsideColor || !kerbsideReg)
    ) {
      alert("Please fill all kerbside details.");
      return;
    }

    setDeliveryPopup(false);
    setAllergyPopup(true);
  };

  const placeOrder = async () => {
  if (processingPayment) return;

  // Ensure user is signed in before we begin payment flow; otherwise we
  // would early-return while `processingPayment` remains true which blocks
  // further attempts.
  if (!user) {
    alert("Please sign in to place an order.");
    return;
  }

  try {
    setProcessingPayment(true);

    const amount = getFinalTotal();
    if (amount <= 0) {
      alert("Invalid amount");
      setProcessingPayment(false);
      return;
    }

    // 1️⃣ Create Payment Intent
    const res = await fetch(`${API_BASE_URL}/stripe/create-payment-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });

    const data = await res.json();
    if (!data.clientSecret) {
      alert("Payment initialization failed");
      setProcessingPayment(false);
      return;
    }

    // 2️⃣ Init Payment Sheet
    const init = await initPaymentSheet({
      paymentIntentClientSecret: data.clientSecret,
      merchantDisplayName: "Crispy Dosa",
    });

    if (init.error) {
      alert(init.error.message);
      setProcessingPayment(false);
      return;
    }

    // 3️⃣ Present Payment Sheet
    const paymentResult = await presentPaymentSheet();

    if (paymentResult.error) {
      // ❗ user cancelled manually
      setProcessingPayment(false);
      return;
    }

    // 4️⃣ SUCCESS → Create Order
    const payload = {
      user_id: user.id,
      customer_id: user.customer_id ?? user.id,
      payment_mode: 1,
      payment_request_id: data.payment_intent_id,
      instore: deliveryMethod === "instore" ? 1 : 0,
      allergy_note: allergyNote,
      car_color: kerbsideColor,
      reg_number: kerbsideReg,
      owner_name: kerbsideName,
      mobile_number: user.mobile_number || "",
      wallet_used: useWallet ? walletUsed : 0,
      items: cart.map((i) => ({
        product_id: i.product_id,
        product_name: i.product_name,
        price: i.product_price,
        discount_amount: i.discount_price
          ? i.product_price - i.discount_price
          : 0,
        vat: 0,
        quantity: i.product_quantity,
      })),
    };

    const orderRes = await createOrder(payload);

    if (orderRes.status === 1) {
      setOrderPlaced(true);

      // Persist created order locally so Orders screen can show it immediately
      let createdOrderId = null;
      try {
        // Determine created object and orderId robustly (backends vary)
        let created = null;

        if (orderRes.data && typeof orderRes.data === "object" && (orderRes.data.order_id || orderRes.data.id)) {
          created = orderRes.data;
        } else if (orderRes.order && (orderRes.order.order_id || orderRes.order.id)) {
          created = orderRes.order;
        } else if (orderRes.order_id || orderRes.id) {
          // minimal info from response
          created = {
            order_id: orderRes.order_id || orderRes.id,
            order_no: orderRes.order_no || `#${orderRes.order_id || orderRes.id}`,
            total_amount: orderRes.total_amount ?? orderRes.amount ?? getFinalTotal(),
            items: payload.items,
            created_at: orderRes.created_at || new Date().toISOString(),
          };
        } else {
          // fallback: synthesize a local record if server didn't supply an id
          const syntheticId = `local_${Date.now()}`;
          created = {
            order_id: syntheticId,
            order_no: `#${syntheticId}`,
            total_amount: getFinalTotal(),
            items: payload.items,
            created_at: new Date().toISOString(),
            note: "Locally recorded order (awaiting server id)",
          };
        }

        const orderId = created.order_id || created.id || created.orderId || null;
        if (orderId) {
          const key = `order_${orderId}`;
          await AsyncStorage.setItem(key, JSON.stringify(created));

          // update orders cache (most recent first)
          const existing = await AsyncStorage.getItem("orders_cache");
          let arr = existing ? JSON.parse(existing) : [];
          // make sure we don't duplicate
          arr = [created].concat(arr.filter(o => (o.order_id || o.id) !== (orderId)));
          await AsyncStorage.setItem("orders_cache", JSON.stringify(arr));

          // remember for navigation
          createdOrderId = orderId;
        }
      } catch (e) {
        console.warn("Failed to cache created order", e);
      }

      // clear local cart & persisted cart key if present
      try {
        setCart([]);
        await AsyncStorage.removeItem("cart");
      } catch (e) {
        console.warn("Failed to clear cart", e);
      }

      // navigate to Orders screen and pass the new order id so Orders can show it instantly
      const newOrderId = createdOrderId || (orderRes.data && (orderRes.data.order_id || orderRes.data.id)) || orderRes.order_id || orderRes.id || `local_${Date.now()}`;
      navigation.navigate("Orders", { newOrderId });
    } else {
      alert(orderRes.message || "Order failed");
    }

    setProcessingPayment(false);
  } catch (err) {
    console.error("Stripe/order error:", err);
    setProcessingPayment(false);
    alert("Something went wrong");
  }
};

  const { refreshing, onRefresh } = useRefresh(async () => {
  if (!user) return;

  const cid = user.id ?? user.customer_id;
  const res = await getCart(cid);

  if (res?.status === 1) {
    setCart(res.data || []);
  }
});


  const renderDeliverySummary = () => (
    <View style={styles.deliverySummaryBox}>
      <Text style={styles.summaryText}>
        <Text style={styles.bold}>Takeaway Method: </Text>
        {deliveryMethod === "kerbside" ? "Kerbside Pickup" : "In-store Pickup"}
      </Text>

      {deliveryMethod === "kerbside" && (
        <>
          <Text style={styles.summaryText}>
            <Text style={styles.bold}>Name: </Text>
            {kerbsideName}
          </Text>
          <Text style={styles.summaryText}>
            <Text style={styles.bold}>Car Colour: </Text>
            {kerbsideColor}
          </Text>
          <Text style={styles.summaryText}>
            <Text style={styles.bold}>Reg Number: </Text>
            {kerbsideReg}
          </Text>
        </>
      )}

      {allergyNote ? (
        <Text style={styles.summaryText}>
          <Text style={styles.bold}>Allergy Note: </Text>
          {allergyNote}
        </Text>
      ) : null}
    </View>
  );

  useEffect(() => {
  if (!isFocused) return;

  (async () => {
    const data = await getWalletSummary();
    setWalletBalance(Number(data.wallet_balance || 0));
  })();
}, [isFocused]);


  return (
    // 🔧 no extra top/bottom padding; AppHeader & BottomBar handle it
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <AppHeader
        user={user}
        navigation={navigation}
        cartItems={cartItemsMap}
        onMenuPress={() => setMenuVisible(true)}
      />

      <FlatList
        data={visibleCart}
  keyExtractor={(i, idx) => String(i.product_id ?? i.id ?? idx)}
  contentContainerStyle={{ padding: 16, paddingBottom: 220 }}
        ListHeaderComponent={
          <>
            <View style={styles.summaryBox}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Icon
                  name="clipboard-list-outline"
                  size={26}
                  color="#28a745"
                />
                <Text style={styles.summaryTitle}>Order Summary</Text>
              </View>
              <Text style={styles.summarySub}>
                Review your items before placing the order.
              </Text>
            </View>

            {!deliveryPopup && !allergyPopup && renderDeliverySummary()}
          </>
        }
        ListEmptyComponent={
          <View style={styles.centerBox}>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptySubtitle}>Add items to proceed to checkout.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.product_name}</Text>
              {item.textfield ? (
                <Text style={styles.itemNote}>Note: {item.textfield}</Text>
              ) : null}
              <Text style={styles.itemQty}>
                {item.product_quantity} × £
                {Number(
                  item.discount_price ?? item.product_price ?? 0
                ).toFixed(2)}
              </Text>
            </View>
            <Text style={styles.itemPrice}>
              £
              {(
                Number(item.discount_price ?? item.product_price ?? 0) *
                item.product_quantity
              ).toFixed(2)}
            </Text>
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {/* WALLET SECTION */}
{walletBalance > 0 && (
  <View style={styles.walletBox}>
    <View style={{ flex: 1 }}>
      <Text style={styles.walletTitle}>Wallet Balance</Text>
      <Text style={styles.walletAmount}>£{walletBalance.toFixed(2)}</Text>
    </View>
      {useWallet && walletUsed > 0 && (
    <Text style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
      Wallet used: -£{walletUsed.toFixed(2)}
    </Text>
  )}

    <TouchableOpacity
      style={[
        styles.walletBtn,
        useWallet && styles.walletBtnActive,
      ]}
      onPress={() => {
        if (useWallet) {
          setUseWallet(false);
          setWalletUsed(0);
        } else {
          const total = getCartTotal();
          const usable = Math.min(walletBalance, total);
          setUseWallet(true);
          setWalletUsed(usable);
        }
      }}
    >
      <Text style={styles.walletBtnText}>
        {useWallet ? "Remove" : "Apply"}
      </Text>
    </TouchableOpacity>
  </View>
)}

      {/* FLOATING BAR – stays above bottom bar */}
      {!deliveryPopup && !allergyPopup && visibleCart.length > 0 && (
        <View style={styles.floatingBar}>
          <View>
            <Text style={styles.floatLabel}>Grand Total</Text>
            <Text style={styles.floatAmount}>£{getFinalTotal().toFixed(2)}</Text>
          </View>
          <TouchableOpacity
              style={[
                styles.floatBtn,
                (processingPayment || getFinalTotal() <= 0) && { opacity: 0.6 }
              ]}
              disabled={processingPayment || getFinalTotal() <= 0}
              onPress={placeOrder}
            >
            <Text style={styles.floatBtnText}>Place Order</Text>
            <Icon name="chevron-right" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      <MenuModal
        visible={menuVisible}
        setVisible={setMenuVisible}
        user={user}
        navigation={navigation}
      />
      <BottomBar navigation={navigation} />

      {/* DELIVERY POPUP */}
      <Modal visible={deliveryPopup} transparent animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popupBox}>
            {/* Back button */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <Icon name="arrow-left" size={22} color="#333" />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>

            <View style={styles.titleRow}>
              <Icon
                name="shopping-outline"    // NORMAL BAG ICON
                size={26}
                color="#28a745"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.popupTitle}>Select Takeaway Method</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.methodBox,
                deliveryMethod === "kerbside" && styles.methodSelected,
              ]}
              onPress={() => setDeliveryMethod("kerbside")}
            >
              <Icon name="car-outline" size={24} color="#333" />
              <Text style={styles.methodText}>Kerbside Pickup</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.methodBox,
                deliveryMethod === "instore" && styles.methodSelected,
              ]}
              onPress={() => setDeliveryMethod("instore")}
            >
              <Icon name="storefront-outline" size={24} color="#333" />
              <Text style={styles.methodText}>In-store Pickup</Text>
            </TouchableOpacity>

            {deliveryMethod === "kerbside" && (
              <View style={styles.inputArea}>
                <TextInput
                  style={styles.input}
                  placeholder="Car Name"
                  value={kerbsideName}
                  onChangeText={setKerbsideName}
                  placeholderTextColor="#777777"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Car Colour"
                  value={kerbsideColor}
                  onChangeText={setKerbsideColor}
                  placeholderTextColor="#777777"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Car Reg Number"
                  value={kerbsideReg}
                  onChangeText={setKerbsideReg}
                  placeholderTextColor="#777777"
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={continueDeliverySelection}
            >
              <Text style={styles.primaryText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ALLERGY POPUP */}
      <Modal visible={allergyPopup} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.popupOverlay}
        >
          <View style={styles.popupBox}>
            {/* Back button */}
            <TouchableOpacity
              onPress={() => {
                setAllergyPopup(false);
                setDeliveryPopup(true);
              }}
              style={styles.backBtn}
            >
              <Icon name="arrow-left" size={22} color="#333" />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>

            <Icon
              name="alert-circle-outline"
              size={40}
              color="#ff6f00"
              style={styles.popupIcon}
            />

            <Text style={styles.popupTitle}>
              Any allergies or requirements?
            </Text>

            {/* Dummy restaurant number */}
            <Text style={styles.allergyWarning}>
              For allergy concerns, please contact the restaurant at{" "}
              <Text style={{ fontWeight: "700" }}>020 7946 0999</Text>.
            </Text>

            <TextInput
              style={[styles.input, { minHeight: 80 }]}
              placeholder="Add your note (optional)"
              value={allergyNote}
              onChangeText={setAllergyNote}
              multiline
              placeholderTextColor="#777777"
            />

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setAllergyPopup(false)}
            >
              <Text style={styles.primaryText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* SUCCESS POPUP */}
      <Modal visible={orderPlaced} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successBox}>
            <Icon name="check-decagram" size={50} color="#28a745" />
            <Text style={styles.successText}>
              Order Placed Successfully!
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  walletBox: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#f1f8e9",
  padding: 14,
  borderRadius: 5,
  marginBottom: 200,
  borderLeftWidth: 4,
  borderLeftColor: "#28a745",
},
walletTitle: {
  fontSize: 14,
  color: "#333",
  fontWeight: "600",
},
walletAmount: {
  fontSize: 18,
  fontWeight: "800",
  color: "#28a745",
},
walletBtn: {
  backgroundColor: "#28a745",
  paddingVertical: 8,
  paddingHorizontal: 16,
  borderRadius: 5,
},
walletBtnActive: {
  backgroundColor: "#999",
},
walletBtnText: {
  color: "#fff",
  fontSize: 14,
  fontWeight: "700",
},

  titleRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 12,
},

  summaryBox: {
    padding: 16,
    borderRadius: 5,
    backgroundColor: "#e8f5e9",
    marginBottom: 16,
  },
  summaryTitle: { fontSize: 18, fontWeight: "700", color: "#222" },
  summarySub: { color: "#555", marginTop: 4, fontSize: 14 },

  deliverySummaryBox: {
    padding: 14,
    backgroundColor: "#f1f8e9",
    borderLeftWidth: 4,
    borderLeftColor: "#28a745",
    borderRadius: 5,
    marginBottom: 16,
  },
  summaryText: { fontSize: 14, marginBottom: 4, color: "#333" },
  bold: { fontWeight: "700" },

  itemCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    elevation: 3,
  },
  itemName: { fontSize: 15, fontWeight: "700", color: "#222" },
  itemNote: { marginTop: 4, fontSize: 13, color: "#ff6f00" },
  itemQty: { marginTop: 4, fontSize: 13, color: "#555" },
  itemPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#28a745",
    alignSelf: "center",
  },

  floatingBar: {
    position: "absolute",
    bottom: 80, // sits just above BottomBar
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 10,
  },
  floatLabel: { fontSize: 13, color: "#777" },
  floatAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: "#28a745",
    marginTop: 2,
  },
  floatBtn: {
    backgroundColor: "#28a745",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  floatBtnText: { color: "#fff", fontSize: 15, fontWeight: "700", marginRight: 6 },

  // POPUPS
  popupOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: 16,
  },
  popupBox: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 5,
    width: "90%",
  },
  popupIcon: { alignSelf: "center", marginBottom: 8 },

  backBtn: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  backBtnText: { marginLeft: 6, fontSize: 15, fontWeight: "700", color: "#333" },

  popupTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
    color: "#222",
  },
  allergyWarning: {
    fontSize: 13,
    color: "#444",
    textAlign: "center",
    marginBottom: 14,
    lineHeight: 18,
  },

  methodBox: {
    padding: 14,
    backgroundColor: "#f3f3f3",
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  methodSelected: {
    backgroundColor: "#c8e6c9",
    borderWidth: 1,
    borderColor: "#28a745",
  },
  methodText: { marginLeft: 12, fontSize: 15, fontWeight: "600", color: "#222" },

  inputArea: { marginTop: 10 },
  input: {
    padding: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
    fontSize: 14,
    color: "#222",
  },

  primaryBtn: {
    backgroundColor: "#28a745",
    padding: 14,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 6,
  },
  primaryText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  successOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  successBox: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 5,
    alignItems: "center",
  },
  successText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "800",
    color: "#28a745",
  },
});
