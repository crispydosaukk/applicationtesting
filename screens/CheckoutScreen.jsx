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
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useIsFocused } from "@react-navigation/native";
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
  const insets = useSafeAreaInsets();
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
  const [loyaltyCredits, setLoyaltyCredits] = useState([]);
  const [loyaltyUsed, setLoyaltyUsed] = useState(0);
  const [useLoyalty, setUseLoyalty] = useState(false);

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
    return (visibleCart || []).reduce((sum, item) => {
      const p = Number(item.discount_price ?? item.product_price ?? 0);
      return sum + p * (item.product_quantity || 0);
    }, 0);
  };

  const getFinalTotal = () => {
    const total = getCartTotal();
    return Math.max(
      0,
      total
      - (useWallet ? walletUsed : 0)
      - (useLoyalty ? loyaltyUsed : 0)
    );
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
        loyalty_used: useLoyalty ? loyaltyUsed : 0,
        items: (visibleCart || []).filter(i => (i.product_quantity || 0) > 0).map((i) => ({
          product_id: i.product_id,
          product_name: i.product_name,
          price: i.product_price,
          discount_amount: i.discount_price
            ? i.product_price - i.discount_price
            : 0,
          vat: 0,
          quantity: Number(i.product_quantity) || 0,
        })),

      };

      const orderRes = await createOrder(payload);
      if (orderRes.status === 1) {
        const created = orderRes.data;
        const orderId = created?.order_id;

        // show success popup
        setOrderPlaced(true);

        // cache order if id exists
        if (orderId) {
          await AsyncStorage.setItem(
            `order_${orderId}`,
            JSON.stringify(created)
          );

          const existing = await AsyncStorage.getItem("orders_cache");
          const arr = existing ? JSON.parse(existing) : [];
          await AsyncStorage.setItem(
            "orders_cache",
            JSON.stringify([created, ...arr])
          );
        } else {
          console.warn("Order placed but order_id missing", orderRes);
        }

        // clear cart
        setCart([]);
        await AsyncStorage.removeItem("cart");

        // redirect after popup
        setTimeout(() => {
          setOrderPlaced(false);
          navigation.reset({
            index: 0,
            routes: [{ name: "Orders", params: orderId ? { newOrderId: orderId } : {} }],
          });
        }, 1800);

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

      const usableCredits = (data.loyalty_expiry_list || []).filter(
        c => new Date(c.expires_at) > new Date()
      );

      setLoyaltyCredits(usableCredits);

      // ✅ IMPORTANT: do NOT auto apply
      setUseLoyalty(false);
      setLoyaltyUsed(0);
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
        contentContainerStyle={{ paddingBottom: 180 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.summaryBox}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Icon name="clipboard-list-outline" size={26} color="#28a745" />
                <Text style={styles.summaryTitle}>Order Summary</Text>
              </View>
              <Text style={styles.summarySub}>Review your items before placing the order.</Text>
            </View>

            {!deliveryPopup && !allergyPopup && renderDeliverySummary()}
          </>
        }
        ListEmptyComponent={
          <View style={styles.centerBox}>
            <Icon name="cart-outline" size={50} color="#ccc" />
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
                {item.product_quantity} × £{Number(item.discount_price ?? item.product_price ?? 0).toFixed(2)}
              </Text>
            </View>
            <Text style={styles.itemPrice}>
              £{(Number(item.discount_price ?? item.product_price ?? 0) * item.product_quantity).toFixed(2)}
            </Text>
          </View>
        )}
        ListFooterComponent={
          <>
            {/* WALLET & LOYALTY SECTION */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Credits & Rewards</Text>

              {/* Wallet Tile */}
              <View style={[styles.creditTile, useWallet && styles.creditTileActive]}>
                <View style={styles.creditIconBg}>
                  <Icon name="wallet-outline" size={20} color="#28a745" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.creditLabel}>Wallet Balance</Text>
                  <Text style={styles.creditBalance}>£{walletBalance.toFixed(2)}</Text>
                  {walletBalance === 0 && (
                    <TouchableOpacity onPress={() => navigation.navigate("Credits")}>
                      <Text style={styles.referralPrompt}>Refer friends to earn more</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  style={[
                    styles.applyBtn,
                    useWallet && styles.appliedBtn,
                    walletBalance <= 0 && styles.disabledBtn
                  ]}
                  disabled={walletBalance <= 0}
                  onPress={() => {
                    if (useWallet) {
                      setUseWallet(false);
                      setWalletUsed(0);
                    } else {
                      const total = getCartTotal();
                      const usable = Math.min(walletBalance, total);
                      setUseWallet(true);
                      setWalletUsed(Number(usable.toFixed(2)));
                    }
                  }}
                >
                  <Text style={[
                    styles.applyBtnText,
                    useWallet && styles.appliedBtnText,
                    walletBalance <= 0 && styles.disabledBtnText
                  ]}>
                    {useWallet ? "REMOVE" : "APPLY"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Loyalty Tile */}
              <View style={[styles.creditTile, useLoyalty && styles.creditTileActive, { marginTop: 12 }]}>
                <View style={[styles.creditIconBg, { backgroundColor: "#e8f5e9" }]}>
                  <Icon name="star-outline" size={20} color="#28a745" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.creditLabel}>Loyalty Credits</Text>
                  <Text style={styles.creditBalance}>
                    £{loyaltyCredits.reduce((sum, c) => sum + Number(c.credit_value || 0), 0).toFixed(2)}
                  </Text>
                  {loyaltyCredits.length === 0 && (
                    <TouchableOpacity onPress={() => navigation.navigate("Credits")}>
                      <Text style={styles.referralPrompt}>Earn more on every order</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  style={[
                    styles.applyBtn,
                    useLoyalty && styles.appliedBtn,
                    loyaltyCredits.length <= 0 && styles.disabledBtn
                  ]}
                  disabled={loyaltyCredits.length <= 0}
                  onPress={() => {
                    if (useLoyalty) {
                      setUseLoyalty(false);
                      setLoyaltyUsed(0);
                    } else {
                      const total = getCartTotal();
                      const totalLoyaltyValue = loyaltyCredits.reduce((sum, c) => sum + Number(c.credit_value || 0), 0);
                      const usable = Math.min(total, totalLoyaltyValue);
                      setUseLoyalty(true);
                      setLoyaltyUsed(Number(usable.toFixed(2)));
                    }
                  }}
                >
                  <Text style={[
                    styles.applyBtnText,
                    useLoyalty && styles.appliedBtnText,
                    loyaltyCredits.length <= 0 && styles.disabledBtnText
                  ]}>
                    {useLoyalty ? "REMOVE" : "APPLY"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* BILL DETAILS SECTION */}
            {!deliveryPopup && !allergyPopup && visibleCart.length > 0 && (
              <View style={[styles.sectionCard, { marginBottom: 40 }]}>
                <Text style={styles.sectionTitle}>Bill Details</Text>

                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Item Total</Text>
                  <Text style={styles.billValue}>£{getCartTotal().toFixed(2)}</Text>
                </View>

                <View style={styles.billRow}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.billLabel}>Delivery Fee</Text>
                    <Icon name="information-outline" size={14} color="#aaa" style={{ marginLeft: 4 }} />
                  </View>
                  <Text style={[styles.billValue, { color: "#28a745" }]}>FREE</Text>
                </View>

                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Taxes & Charges</Text>
                  <Text style={styles.billValue}>£0.00</Text>
                </View>

                {useWallet && walletUsed > 0 && (
                  <View style={styles.billRow}>
                    <Text style={styles.billLabelDeduction}>Wallet Deduction</Text>
                    <Text style={styles.billValueDeduction}>-£{walletUsed.toFixed(2)}</Text>
                  </View>
                )}

                {useLoyalty && loyaltyUsed > 0 && (
                  <View style={styles.billRow}>
                    <Text style={styles.billLabelDeduction}>Loyalty Credits Used</Text>
                    <Text style={styles.billValueDeduction}>-£{loyaltyUsed.toFixed(2)}</Text>
                  </View>
                )}

                <View style={styles.divider} />

                <View style={styles.billRow}>
                  <Text style={styles.totalLabel}>Grand Total</Text>
                  <Text style={styles.totalValue}>£{getFinalTotal().toFixed(2)}</Text>
                </View>
              </View>
            )}
          </>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />


      {/* FLOATING BAR – stays above bottom bar */}
      {!deliveryPopup && !allergyPopup && visibleCart.length > 0 && (
        <View style={[
          styles.floatingBar,
          { bottom: 82 + (insets.bottom || 0) } // Sit above BottomBar
        ]}>
          <View>
            <Text style={styles.floatLabel}>Total Payable</Text>
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
            {processingPayment ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.floatBtnText}>Proceed to Pay</Text>
                <Icon name="chevron-right" size={20} color="#fff" />
              </>
            )}
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

      {/* DELIVERY POPUP - RE-DESIGNED AS BOTTOM SHEET */}
      <Modal visible={deliveryPopup} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => navigation.goBack()}
          />
          <View style={[styles.sheetBox, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={styles.iconCircle}>
                <Icon name="shopping-outline" size={24} color="#28a745" />
              </View>
              <Text style={styles.sheetTitle}>Takeaway Method</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.methodItem,
                deliveryMethod === "kerbside" && styles.methodItemSelected,
              ]}
              onPress={() => setDeliveryMethod("kerbside")}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Icon name="car-outline" size={22} color={deliveryMethod === "kerbside" ? "#28a745" : "#666"} style={{ marginRight: 12 }} />
                <Text style={styles.methodItemText}>Kerbside Pickup</Text>
              </View>
              <Icon
                name={deliveryMethod === "kerbside" ? "radiobox-marked" : "radiobox-blank"}
                size={22}
                color={deliveryMethod === "kerbside" ? "#28a745" : "#ccc"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.methodItem,
                deliveryMethod === "instore" && styles.methodItemSelected,
              ]}
              onPress={() => setDeliveryMethod("instore")}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Icon name="storefront-outline" size={22} color={deliveryMethod === "instore" ? "#28a745" : "#666"} style={{ marginRight: 12 }} />
                <Text style={styles.methodItemText}>In-store Pickup</Text>
              </View>
              <Icon
                name={deliveryMethod === "instore" ? "radiobox-marked" : "radiobox-blank"}
                size={22}
                color={deliveryMethod === "instore" ? "#28a745" : "#ccc"}
              />
            </TouchableOpacity>

            {deliveryMethod === "kerbside" && (
              <View style={{ marginTop: 8 }}>
                <TextInput
                  style={styles.sheetInputSmall}
                  placeholder="Car Name (e.g. BMW)"
                  value={kerbsideName}
                  onChangeText={setKerbsideName}
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={styles.sheetInputSmall}
                  placeholder="Car Color (e.g. Black)"
                  value={kerbsideColor}
                  onChangeText={setKerbsideColor}
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={styles.sheetInputSmall}
                  placeholder="Reg Number"
                  value={kerbsideReg}
                  onChangeText={setKerbsideReg}
                  placeholderTextColor="#999"
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.sheetSubmitBtn, (!deliveryMethod || (deliveryMethod === "kerbside" && !kerbsideReg)) && { opacity: 0.6 }]}
              disabled={!deliveryMethod || (deliveryMethod === "kerbside" && !kerbsideReg)}
              onPress={() => {
                setDeliveryPopup(false);
                setAllergyPopup(true);
              }}
            >
              <Text style={styles.sheetSubmitText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ALLERGY POPUP - ALSO AS SHEET */}
      <Modal visible={allergyPopup} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => setAllergyPopup(false)}
          />
          <View style={[styles.sheetBox, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.sheetHandle} />
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <View style={[styles.iconCircle, { backgroundColor: "#fff3e0", marginRight: 12 }]}>
                <Icon name="alert-circle-outline" size={24} color="#ff9800" />
              </View>
              <View>
                <Text style={styles.sheetTitle}>Any Food Allergies?</Text>
                <Text style={{ color: "#666", fontSize: 13, marginTop: 4, maxWidth: "90%" }}>
                  For serious allergy concerns, please contact the restaurant directly at <Text style={{ fontWeight: "700", color: "#000" }}>020 7946 0999</Text>
                </Text>
              </View>
            </View>
            <TextInput
              style={styles.sheetInput}
              placeholder="Add your notes here (optional)..."
              placeholderTextColor="#999"
              value={allergyNote}
              onChangeText={setAllergyNote}
              multiline
            />
            <TouchableOpacity
              style={styles.sheetSubmitBtn}
              onPress={() => setAllergyPopup(false)}
            >
              <Text style={styles.sheetSubmitText}>Start Ordering</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* SUCCESS POPUP */}
      <Modal visible={orderPlaced} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successBox}>
            <Icon name="check-decagram" size={60} color="#28a745" />
            <Text style={styles.successText}>Order Placed!</Text>
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

  // Premium Section Cards
  sectionCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopWidth: 8,
    borderTopColor: "#f4f4f4",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#000",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Credits & Rewards
  creditTile: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#f0f0f0",
  },
  creditTileActive: {
    borderColor: "#28a745",
    backgroundColor: "#fafffb",
  },
  creditIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f1f8e9",
    alignItems: "center",
    justifyContent: "center",
  },
  creditLabel: {
    fontSize: 13,
    color: "#444",
    fontWeight: "700",
  },
  creditBalance: {
    fontSize: 15,
    fontWeight: "800",
    color: "#000",
    marginTop: 2,
  },
  referralPrompt: {
    fontSize: 11,
    color: "#28a745",
    fontWeight: "700",
    marginTop: 4,
    textDecorationLine: "underline",
  },
  applyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#28a745",
  },
  appliedBtn: {
    backgroundColor: "#28a745",
  },
  applyBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#28a745",
  },
  appliedBtnText: {
    color: "#fff",
  },
  disabledBtn: {
    borderColor: "#e0e0e0",
    backgroundColor: "#f5f5f5",
  },
  disabledBtnText: {
    color: "#aaa",
  },

  // Bill Details
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  billLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  billValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
  },
  billLabelDeduction: {
    fontSize: 14,
    color: "#e53935",
    fontWeight: "600",
  },
  billValueDeduction: {
    fontSize: 14,
    fontWeight: "700",
    color: "#e53935",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "900",
    color: "#000",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#000",
  },

  // Summary sections
  summaryBox: {
    padding: 20,
    backgroundColor: "#fff",
  },
  summaryTitle: { fontSize: 20, fontWeight: "900", color: "#000" },
  summarySub: { color: "#666", marginTop: 4, fontSize: 13, fontWeight: "500" },

  deliverySummaryBox: {
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#eee",
  },
  summaryText: { fontSize: 13, marginBottom: 4, color: "#444" },
  bold: { fontWeight: "700", color: "#000" },

  itemCard: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f4",
  },
  itemName: { fontSize: 15, fontWeight: "700", color: "#000" },
  itemNote: { marginTop: 4, fontSize: 12, color: "#ff6f00", fontWeight: "600" },
  itemQty: { marginTop: 4, fontSize: 13, color: "#666", fontWeight: "500" },
  itemPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: "#000",
    alignSelf: "flex-start",
  },

  floatingBar: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 25,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -5 },
  },
  floatLabel: { fontSize: 11, color: "#666", fontWeight: "700", textTransform: "uppercase" },
  floatAmount: {
    fontSize: 20,
    fontWeight: "900",
    color: "#000",
  },
  floatBtn: {
    backgroundColor: "#28a745",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 160,
    justifyContent: "center",
  },
  floatBtnText: { color: "#fff", fontSize: 16, fontWeight: "800", marginRight: 6 },

  // Bottom Sheet Styles
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheetBox: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#ddd",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 24,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#000",
    marginLeft: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
  },
  methodItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#eee",
  },
  methodItemSelected: {
    backgroundColor: "#fafffb",
    borderColor: "#28a745",
  },
  methodItemText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#000",
  },
  sheetSubmitBtn: {
    backgroundColor: "#28a745",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 12,
    elevation: 4,
  },
  sheetSubmitText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  sheetInput: {
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: "#000",
    fontWeight: "600",
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#eee",
  },
  sheetInputSmall: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#000",
    fontWeight: "600",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },

  // Utils
  input: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#eee",
    marginBottom: 14,
    fontSize: 15,
    color: "#000",
    fontWeight: "600",
  },
  primaryBtn: {
    backgroundColor: "#28a745",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    elevation: 4,
  },
  primaryText: { color: "#fff", fontSize: 17, fontWeight: "900" },
  successOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  successBox: {
    backgroundColor: "#fff",
    padding: 50,
    borderRadius: 30,
    alignItems: "center",
  },
  successText: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: "900",
    color: "#28a745",
  },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 100 },
  emptyTitle: { fontSize: 20, fontWeight: "900", color: "#000", marginTop: 16 },
  emptySubtitle: { color: "#666", marginTop: 6, fontSize: 14, fontWeight: "500" },
  backBtn: { flexDirection: "row", alignItems: "center", marginBottom: 25 },
  backBtnText: { marginLeft: 8, fontSize: 17, fontWeight: "900", color: "#000" },
});
