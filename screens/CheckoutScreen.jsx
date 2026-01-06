import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useIsFocused } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import useRefresh from "../hooks/useRefresh";

import AppHeader from "./AppHeader";
import BottomBar from "./BottomBar";
import MenuModal from "./MenuModal";
import { getCart } from "../services/cartService";
import { createOrder } from "../services/orderService";
import { getWalletSummary } from "../services/walletService";
import { useStripe } from "@stripe/stripe-react-native";
import { API_BASE_URL } from "../config/baseURL";

const { width, height } = Dimensions.get("window");
const scale = width / 400;

const AnimatedView = Animated.createAnimatedComponent(View);

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
  const [earnedPoints, setEarnedPoints] = useState(0);

  // Success Toast State
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const toastAnim = useRef(new Animated.Value(-100)).current;

  // Full Screen Success Animation
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  const isFocused = useIsFocused();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const walletScale = useRef(new Animated.Value(0)).current;
  const loyaltyScale = useRef(new Animated.Value(0)).current;

  const cartItemsMap = useMemo(() => {
    const map = {};
    cart.forEach((item) => {
      const qty = item.product_quantity || 0;
      if (qty > 0) map[item.product_id] = qty;
    });
    return map;
  }, [cart]);

  const visibleCart = useMemo(() => {
    return (cart || []).filter((i) => (i.product_quantity || 0) > 0);
  }, [cart]);

  useEffect(() => {
    if (isFocused) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [isFocused]);

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
    return Math.max(0, total - (useWallet ? walletUsed : 0) - (useLoyalty ? loyaltyUsed : 0));
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setToastVisible(true);
    Animated.sequence([
      Animated.spring(toastAnim, { toValue: 60, useNativeDriver: true, tension: 40, friction: 7 }),
      Animated.delay(2000),
      Animated.timing(toastAnim, { toValue: -100, duration: 500, useNativeDriver: true })
    ]).start(() => setToastVisible(false));
  };

  const animateWallet = (show) => {
    Animated.spring(walletScale, {
      toValue: show ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
    if (show) showToast("Congrats! Wallet credits applied.");
  };

  const animateLoyalty = (show) => {
    Animated.spring(loyaltyScale, {
      toValue: show ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
    if (show) showToast("Awesome! Loyalty rewards added.");
  };

  const handleWalletToggle = () => {
    if (useWallet) {
      setUseWallet(false);
      setWalletUsed(0);
      animateWallet(false);
    } else {
      const amount = Math.min(walletBalance, getCartTotal());
      setUseWallet(true);
      setWalletUsed(amount);
      animateWallet(true);
    }
  };

  const handleLoyaltyToggle = () => {
    if (useLoyalty) {
      setUseLoyalty(false);
      setLoyaltyUsed(0);
      animateLoyalty(false);
    } else {
      const totalLoyalty = loyaltyCredits.reduce((sum, c) => sum + Number(c.credit_value), 0);
      const amount = Math.min(totalLoyalty, getCartTotal());
      setUseLoyalty(true);
      setLoyaltyUsed(amount);
      animateLoyalty(true);
    }
  };

  const triggerSuccessAnimation = () => {
    setOrderPlaced(true);
    Animated.parallel([
      Animated.spring(successScale, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }),
      Animated.timing(successOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  };

  const placeOrder = async () => {
    if (processingPayment) return;
    if (!user) {
      alert("Please sign in to place an order.");
      navigation.navigate("Login");
      return;
    }

    try {
      setProcessingPayment(true);
      const amount = getFinalTotal();

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

      const init = await initPaymentSheet({
        paymentIntentClientSecret: data.clientSecret,
        merchantDisplayName: "Crispy Dosa",
      });

      if (init.error) {
        alert(init.error.message);
        setProcessingPayment(false);
        return;
      }

      const paymentResult = await presentPaymentSheet();
      if (paymentResult.error) {
        setProcessingPayment(false);
        return;
      }

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
        items: (visibleCart || []).map((i) => ({
          product_id: i.product_id,
          product_name: i.product_name,
          price: i.product_price,
          discount_amount: i.discount_price ? i.product_price - i.discount_price : 0,
          vat: 0,
          quantity: Number(i.product_quantity) || 0,
        })),
      };

      const orderRes = await createOrder(payload);
      if (orderRes.status === 1) {
        // Calculate earned amount (e.g., 5% of order value)
        const earned = (getFinalTotal() * 0.05).toFixed(2);
        setEarnedPoints(earned); // Reusing state but showing as amount
        triggerSuccessAnimation();
        setCart([]);
        await AsyncStorage.removeItem("cart");
        setTimeout(() => {
          Animated.timing(successOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
            setOrderPlaced(false);
            navigation.reset({
              index: 0,
              routes: [{ name: "Orders", params: orderRes.data?.order_id ? { newOrderId: orderRes.data.order_id } : {} }],
            });
          });
        }, 3000);
      } else {
        alert(orderRes.message || "Order failed");
      }
      setProcessingPayment(false);
    } catch (err) {
      setProcessingPayment(false);
      alert("Something went wrong");
    }
  };

  const { refreshing, onRefresh } = useRefresh(async () => {
    if (!user) return;
    const cid = user.id ?? user.customer_id;
    const res = await getCart(cid);
    if (res?.status === 1) setCart(res.data || []);
  });

  useEffect(() => {
    if (!isFocused) return;
    (async () => {
      const data = await getWalletSummary();
      setWalletBalance(Number(data.wallet_balance || 0));
      const usableCredits = (data.loyalty_expiry_list || []).filter(c => new Date(c.expires_at) > new Date());
      setLoyaltyCredits(usableCredits);
      setUseLoyalty(false);
      setLoyaltyUsed(0);
    })();
  }, [isFocused]);

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <AppHeader user={user} navigation={navigation} cartItems={cartItemsMap} onMenuPress={() => setMenuVisible(true)} />

      {/* Congrats Animated Toast */}
      {toastVisible && (
        <AnimatedView style={[styles.premiumToast, { transform: [{ translateY: toastAnim }] }]}>
          <LinearGradient colors={["#16a34a", "#15803d"]} style={styles.toastInner}>
            <Ionicons name="sparkles" size={20} color="#FFF" />
            <Text style={styles.toastText}>{toastMsg}</Text>
          </LinearGradient>
        </AnimatedView>
      )}

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <FlatList
          data={visibleCart}
          keyExtractor={(i, idx) => String(i.product_id ?? idx)}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.headerCover}>
              <View style={styles.listHeader}>
                <View style={styles.headerLeft}>
                  <Text style={styles.headerTitle}>Review Checkout</Text>
                  <Text style={styles.headerSub}>{visibleCart.length} {visibleCart.length === 1 ? 'item' : 'items'} in your order</Text>
                </View>
                <TouchableOpacity style={styles.addMoreBtn} onPress={() => navigation.goBack()}>
                  <Ionicons name="add-circle-outline" size={18} color="#FF2B5C" />
                  <Text style={styles.addMoreText}>Add more</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.prefSummary}>
                {deliveryMethod && (
                  <View style={[styles.prefBadge, deliveryMethod === 'kerbside' ? { flexDirection: 'column', alignItems: 'flex-start' } : null]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name={deliveryMethod === 'instore' ? "walk" : "car"} size={16} color="#16a34a" />
                      <Text style={[styles.badgeText, { fontSize: 15 }]}>
                        {deliveryMethod === 'instore' ? "Collecting In-store" : "Kerbside Delivery"}
                      </Text>
                    </View>
                    {deliveryMethod === 'kerbside' && (
                      <View style={{ marginTop: 6, marginLeft: 26, width: '100%' }}>
                        {kerbsideName ? <Text style={styles.badgeSubText}>• Car: {kerbsideName}</Text> : null}
                        {kerbsideColor ? <Text style={styles.badgeSubText}>• Color: {kerbsideColor}</Text> : null}
                        {kerbsideReg ? <Text style={styles.badgeSubText}>• Reg: {kerbsideReg}</Text> : null}
                      </View>
                    )}
                  </View>
                )}
                {allergyNote ? (
                  <View style={[styles.prefBadge, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}>
                    <Ionicons name="medical" size={14} color="#EA580C" />
                    <Text style={[styles.badgeText, { color: '#EA580C' }]}>Allergy: {allergyNote}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <View style={styles.nameHeader}>
                  <Ionicons name="radio-button-on" size={12} color="#16a34a" style={{ marginRight: 6, marginTop: 3 }} />
                  <Text style={styles.itemName} numberOfLines={2}>{item.product_name}</Text>
                </View>
                {item.textfield ? (
                  <View style={styles.noteBox}>
                    <Text style={styles.itemNote}>“{item.textfield}”</Text>
                  </View>
                ) : null}
                <Text style={styles.itemPriceUnit}>£{Number(item.discount_price ?? item.product_price).toFixed(2)}</Text>
              </View>

              <View style={styles.actionCol}>
                <Text style={styles.qtyLabelText}>Qty: {item.product_quantity}</Text>
                <Text style={styles.totalTextSmall}>£{(Number(item.discount_price ?? item.product_price) * item.product_quantity).toFixed(2)}</Text>
              </View>
            </View>
          )}
          ListFooterComponent={
            <View style={styles.billSummary}>
              {/* Credits Section */}
              <Text style={styles.billTitle}>Credits & Loyalty</Text>
              <View style={styles.creditCard}>
                <View style={styles.creditRow}>
                  <View style={styles.creditIcon}>
                    <Ionicons name="wallet-outline" size={24} color="#16a34a" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={styles.creditLabel}>Wallet Balance</Text>
                    <Text style={styles.creditVal}>£{walletBalance.toFixed(2)}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.applyBtn, useWallet && styles.appliedBtn, walletBalance <= 0 && { opacity: 0.3 }]}
                    disabled={walletBalance <= 0}
                    onPress={handleWalletToggle}
                  >
                    <Text style={[styles.applyBtnText, useWallet && { color: "#FFF" }]}>{useWallet ? "REMOVE" : "APPLY"}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.creditDivider} />

                <View style={[styles.creditRow]}>
                  <View style={[styles.creditIcon, { backgroundColor: '#F0F9FF' }]}>
                    <Ionicons name="star-outline" size={24} color="#0EA5E9" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={styles.creditLabel}>Loyalty Credits</Text>
                    <Text style={styles.creditVal}>
                      £{loyaltyCredits.reduce((sum, c) => sum + Number(c.credit_value || 0), 0).toFixed(2)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.applyBtn, useLoyalty && styles.appliedBtn, loyaltyCredits.length <= 0 && { opacity: 0.3 }]}
                    disabled={loyaltyCredits.length <= 0}
                    onPress={handleLoyaltyToggle}
                  >
                    <Text style={[styles.applyBtnText, useLoyalty && { color: "#FFF" }]}>{useLoyalty ? "REMOVE" : "APPLY"}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bill Details */}
              <Text style={styles.billTitle}>Price Details</Text>
              <View style={styles.billCard}>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Cart Total</Text>
                  <Text style={styles.billValue}>£{getCartTotal().toFixed(2)}</Text>
                </View>

                {useWallet && walletUsed > 0 && (
                  <AnimatedView style={[styles.billRow, { transform: [{ scale: walletScale }], opacity: walletScale }]}>
                    <Text style={styles.billLabelDeduct}>Wallet Applied</Text>
                    <Text style={styles.billValueDeduct}>-£{walletUsed.toFixed(2)}</Text>
                  </AnimatedView>
                )}

                {useLoyalty && loyaltyUsed > 0 && (
                  <AnimatedView style={[styles.billRow, { transform: [{ scale: loyaltyScale }], opacity: loyaltyScale }]}>
                    <Text style={styles.billLabelDeduct}>Loyalty Applied</Text>
                    <Text style={styles.billValueDeduct}>-£{loyaltyUsed.toFixed(2)}</Text>
                  </AnimatedView>
                )}

                <View style={styles.billDivider} />
                <View style={styles.billRow}>
                  <Text style={styles.grandLabel}>Amount Payable</Text>
                  <Text style={styles.grandValue}>£{getFinalTotal().toFixed(2)}</Text>
                </View>
              </View>

              {/* Safety Badge */}
              <View style={styles.safetyCard}>
                <Ionicons name="shield-checkmark" size={24} color="#16a34a" />
                <View style={styles.safetyTextRow}>
                  <Text style={styles.safetyTitle}>Safety & Hygiene Guaranteed</Text>
                  <Text style={styles.safetySub}>Trained professionals preparing your food</Text>
                </View>
              </View>

              {/* ULTIMATE BUSINESS CHECKOUT BAR (Cart Summary Style) */}
              {!deliveryPopup && !allergyPopup && visibleCart.length > 0 && (
                <View style={styles.premiumCheckoutBar}>
                  <View style={styles.summaryLeft}>
                    <Text style={styles.itemCountText}>{visibleCart.length} {visibleCart.length === 1 ? 'Item' : 'Items'}</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.totalLabelSmall}>Total:</Text>
                      <Text style={styles.finalTotalText}>£{getFinalTotal().toFixed(2)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.actionBtnPremium}
                    onPress={placeOrder}
                    disabled={processingPayment}
                  >
                    <LinearGradient
                      colors={["#16a34a", "#15803d"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.btnGradient}
                    >
                      {processingPayment ? <ActivityIndicator size="small" color="#FFF" /> : (
                        <>
                          <Text style={styles.btnTextPremium}>Pay Now</Text>
                          <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 8 }} />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      </Animated.View>

      {/* Delivery sheet */}
      <Modal visible={deliveryPopup} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => navigation.goBack()} />
          <View style={[styles.sheetContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeaderRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.modalBackBtn}>
                <Ionicons name="arrow-back" size={22} color="#1C1C1C" />
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>Pickup details</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.optionCard, deliveryMethod === 'kerbside' && styles.optionSelected]}
              onPress={() => setDeliveryMethod("kerbside")}
            >
              <View style={styles.optionIconContainer}>
                <Ionicons name="car" size={26} color={deliveryMethod === 'kerbside' ? "#16a34a" : "#999"} />
              </View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.optionTitle}>Kerbside Delivery</Text>
                <Text style={styles.optionSub}>We bring it to your car</Text>
              </View>
              <Ionicons name={deliveryMethod === 'kerbside' ? "radio-button-on" : "radio-button-off"} size={22} color={deliveryMethod === 'kerbside' ? "#16a34a" : "#DDD"} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.optionCard, deliveryMethod === 'instore' && styles.optionSelected]}
              onPress={() => setDeliveryMethod("instore")}
            >
              <View style={styles.optionIconContainer}>
                <Ionicons name="walk" size={26} color={deliveryMethod === 'instore' ? "#16a34a" : "#999"} />
              </View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.optionTitle}>In-store Pickup</Text>
                <Text style={styles.optionSub}>You collect from our counter</Text>
              </View>
              <Ionicons name={deliveryMethod === 'instore' ? "radio-button-on" : "radio-button-off"} size={22} color={deliveryMethod === 'instore' ? "#16a34a" : "#DDD"} />
            </TouchableOpacity>

            {deliveryMethod === 'kerbside' && (
              <View style={styles.kerbsideFields}>
                <TextInput style={styles.kInput} placeholder="Car Name / Make" value={kerbsideName} onChangeText={setKerbsideName} placeholderTextColor="#BCBCBC" />
                <TextInput style={styles.kInput} placeholder="Car Color" value={kerbsideColor} onChangeText={setKerbsideColor} placeholderTextColor="#BCBCBC" />
                <TextInput style={styles.kInput} placeholder="Reg Number" value={kerbsideReg} onChangeText={setKerbsideReg} placeholderTextColor="#BCBCBC" />
              </View>
            )}

            <TouchableOpacity
              style={[styles.sheetActionBtn, !deliveryMethod && { opacity: 0.5 }]}
              disabled={!deliveryMethod}
              onPress={() => { setDeliveryPopup(false); setAllergyPopup(true); }}
            >
              <LinearGradient colors={["#16a34a", "#059669"]} style={styles.sheetActionGrad}>
                <Text style={styles.sheetActionText}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Allergy sheet */}
      <Modal visible={allergyPopup} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setAllergyPopup(false)} />
          <View style={[styles.sheetContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeaderRow}>
              <TouchableOpacity onPress={() => { setAllergyPopup(false); setDeliveryPopup(true); }} style={styles.modalBackBtn}>
                <Ionicons name="arrow-back" size={22} color="#1C1C1C" />
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>Food Allergies?</Text>
            </View>
            <Text style={styles.sheetDesc}>Tell us if we need to be careful with any specific ingredients.</Text>
            <TextInput
              style={styles.allergyInput}
              placeholder="e.g. No Peanuts, No Dairy..."
              multiline
              value={allergyNote}
              onChangeText={setAllergyNote}
              placeholderTextColor="#999"
            />
            <TouchableOpacity style={styles.sheetActionBtn} onPress={() => setAllergyPopup(false)}>
              <LinearGradient colors={["#16a34a", "#059669"]} style={styles.sheetActionGrad}>
                <Text style={styles.sheetActionText}>Review Order Summary</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Full Screen High-End Order Success Modal */}
      <Modal visible={orderPlaced} transparent animationType="none">
        <View style={styles.successFullOverlay}>
          <LinearGradient colors={["#16A34A", "#15803D"]} style={styles.successGrad}>
            <Animated.View style={[styles.successContent, { opacity: successOpacity, transform: [{ scale: successScale }] }]}>
              <View style={styles.successIconRing}>
                <Ionicons name="checkmark-sharp" size={80} color="#16a34a" />
              </View>
              <Text style={styles.fullSuccessTitle}>Order Placed!</Text>
              <Text style={styles.fullSuccessSub}>Your delicious meal is on its way.</Text>

              <View style={styles.rewardCard}>
                <Ionicons name="gift" size={30} color="#EAB308" />
                <View style={{ marginLeft: 15 }}>
                  <Text style={styles.rewardTitle}>Congrats! £{earnedPoints} Earned</Text>
                  <Text style={styles.rewardSub}>Check it in your Credits screen</Text>
                </View>
              </View>

              <View style={styles.confettiContainer}>
                {[...Array(6)].map((_, i) => (
                  <View key={i} style={[styles.confetti, { top: Math.random() * 200, left: Math.random() * 300 }]} />
                ))}
              </View>
            </Animated.View>
          </LinearGradient>
        </View>
      </Modal>

      <MenuModal visible={menuVisible} setVisible={setMenuVisible} user={user} navigation={navigation} />
      <BottomBar navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F8F8" },
  headerCover: { backgroundColor: "#FFF", borderBottomWidth: 1, borderBottomColor: '#F5F5F5', paddingBottom: 15 },

  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', padding: 20, paddingTop: 15 },
  headerLeft: { flex: 1 },
  headerTitle: { fontSize: 22 * scale, fontFamily: "PoppinsBold", color: "#1C1C1C", fontWeight: '900' },
  headerSub: { fontSize: 12 * scale, fontFamily: "PoppinsMedium", color: "#888", marginTop: 2 },
  addMoreBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,43,92,0.08)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  addMoreText: { fontSize: 13 * scale, fontFamily: 'PoppinsBold', color: '#FF2B5C', marginLeft: 5 },

  prefSummary: { flexDirection: 'column', paddingHorizontal: 20, marginTop: 12 },
  prefBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#DCFCE7', marginBottom: 12, elevation: 1 },
  badgeText: { fontSize: 13 * scale, fontFamily: "PoppinsBold", color: "#16a34a", marginLeft: 8 },
  badgeSubText: { fontSize: 13 * scale, fontFamily: "PoppinsMedium", color: "#065F46", marginTop: 2 },

  itemRow: { flexDirection: 'row', backgroundColor: '#FFF', marginHorizontal: 20, marginVertical: 6, borderRadius: 12, padding: 16, elevation: 2 },
  itemInfo: { flex: 1, paddingRight: 10 },
  nameHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  itemName: { fontSize: 15 * scale, fontFamily: 'PoppinsBold', color: '#1C1C1C' },
  noteBox: { backgroundColor: '#F9F9F9', padding: 10, borderRadius: 8, marginTop: 8, borderLeftWidth: 3, borderLeftColor: '#DDD' },
  itemNote: { fontSize: 12 * scale, fontFamily: 'PoppinsMedium', fontStyle: 'italic', color: '#666' },
  itemPriceUnit: { fontSize: 14 * scale, fontFamily: 'PoppinsSemiBold', color: '#FF2B5C', marginTop: 8 },

  actionCol: { alignItems: 'flex-end', justifyContent: 'space-between' },
  qtyLabelText: { fontSize: 13 * scale, fontFamily: 'PoppinsBold', color: '#999' },
  totalTextSmall: { fontSize: 16 * scale, fontFamily: 'PoppinsBold', color: '#1C1C1C', marginTop: 10 },

  billSummary: { padding: 20, paddingBottom: 20 },
  billTitle: { fontSize: 18 * scale, fontFamily: 'PoppinsBold', color: '#1C1C1C', marginBottom: 12, fontWeight: '900' },

  creditCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, elevation: 3, borderWidth: 1, borderColor: '#F5F5F5', marginBottom: 25 },
  creditRow: { flexDirection: 'row', alignItems: 'center' },
  creditIcon: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  creditLabel: { fontSize: 11 * scale, fontFamily: "PoppinsMedium", color: "#999", letterSpacing: 0.5 },
  creditVal: { fontSize: 18 * scale, fontFamily: "PoppinsBold", color: "#1C1C1C" },
  applyBtn: { borderWidth: 1.5, borderColor: '#16a34a', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  appliedBtn: { backgroundColor: '#16a34a' },
  applyBtnText: { fontSize: 12 * scale, fontFamily: "PoppinsBold", color: "#16a34a" },
  creditDivider: { height: 1.5, backgroundColor: '#F8F8F8', marginVertical: 18 },

  billCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 18, elevation: 3, marginBottom: 20 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8, alignItems: 'center' },
  billLabel: { fontSize: 14 * scale, fontFamily: 'PoppinsMedium', color: '#777' },
  billValue: { fontSize: 14 * scale, fontFamily: 'PoppinsBold', color: '#1C1C1C' },
  billLabelDeduct: { fontSize: 14 * scale, fontFamily: 'PoppinsBold', color: '#DC2626' },
  billValueDeduct: { fontSize: 15 * scale, fontFamily: 'PoppinsBold', color: '#DC2626' },
  billDivider: { height: 1.5, backgroundColor: '#F0F0F0', marginVertical: 12 },
  grandLabel: { fontSize: 16 * scale, fontFamily: 'PoppinsBold', color: '#1C1C1C', fontWeight: '900' },
  grandValue: { fontSize: 18 * scale, fontFamily: 'PoppinsBold', color: '#16a34a' },

  safetyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', marginTop: 15, padding: 15, borderRadius: 12, marginBottom: 20 },
  safetyTextRow: { marginLeft: 15 },
  safetyTitle: { fontSize: 13 * scale, fontFamily: 'PoppinsBold', color: '#16a34a' },
  safetySub: { fontSize: 11 * scale, fontFamily: 'PoppinsMedium', color: '#336633' },

  premiumCheckoutBar: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  summaryLeft: { flex: 1, marginLeft: 8 },
  itemCountText: { fontSize: 11 * scale, fontFamily: 'PoppinsBold', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2 },
  totalLabelSmall: { fontSize: 13 * scale, fontFamily: 'PoppinsMedium', color: '#666', marginRight: 4 },
  finalTotalText: { fontSize: 22 * scale, fontFamily: 'PoppinsBold', color: '#1C1C1C' },
  actionBtnPremium: { borderRadius: 8, overflow: 'hidden' },
  btnGradient: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 22 },
  btnTextPremium: { color: '#FFF', fontFamily: 'PoppinsBold', fontSize: 16 * scale },

  premiumToast: { position: 'absolute', top: 0, left: 20, right: 20, zIndex: 9999, alignItems: 'center' },
  toastInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, elevation: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10 },
  toastText: { color: '#FFF', fontFamily: "PoppinsBold", fontSize: 14 * scale, marginLeft: 10 },

  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheetContent: { backgroundColor: '#FFF', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 30 },
  sheetHandle: { width: 35, height: 5, backgroundColor: '#E2E8F0', borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  modalBackBtn: { padding: 5, marginRight: 10 },
  sheetTitle: { fontSize: 22 * scale, fontFamily: "PoppinsBold", color: "#1C1C1C", fontWeight: '900' },
  sheetDesc: { fontSize: 14 * scale, fontFamily: "PoppinsMedium", color: "#999", marginBottom: 25 },
  optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFBFB', borderRadius: 12, padding: 18, marginBottom: 15, borderWidth: 1.5, borderColor: '#F1F5F9' },
  optionSelected: { borderColor: '#16a34a', backgroundColor: '#F0FDF4' },
  optionIconContainer: { width: 50, height: 50, backgroundColor: '#FFF', borderRadius: 10, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
  optionTitle: { fontSize: 16 * scale, fontFamily: "PoppinsBold", color: "#1C1C1C" },
  optionSub: { fontSize: 12 * scale, fontFamily: "PoppinsMedium", color: "#999" },
  kerbsideFields: { marginTop: 5, marginBottom: 15 },
  kInput: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 15, fontFamily: 'PoppinsMedium', fontSize: 14, marginBottom: 10, color: '#1C1C1C', borderWidth: 1, borderColor: '#E2E8F0' },
  sheetActionBtn: { borderRadius: 10, overflow: 'hidden', marginTop: 10 },
  sheetActionGrad: { paddingVertical: 16, alignItems: 'center' },
  sheetActionText: { color: '#FFF', fontFamily: "PoppinsBold", fontSize: 17 * scale },
  allergyInput: { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 20, minHeight: 120, textAlignVertical: 'top', fontFamily: 'PoppinsMedium', fontSize: 15, color: '#1C1C1C', marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },

  successFullOverlay: { flex: 1 },
  successGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  successContent: { alignItems: 'center', width: '90%' },
  successIconRing: { width: 150, height: 150, borderRadius: 75, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 20, shadowColor: '#000', shadowOpacity: 0.2, marginBottom: 30 },
  fullSuccessTitle: { fontSize: 36 * scale, fontFamily: "PoppinsBold", color: "#FFF", fontWeight: '900', textAlign: 'center' },
  fullSuccessSub: { fontSize: 18 * scale, fontFamily: "PoppinsMedium", color: "#E0E0E0", textAlign: 'center', marginTop: 10 },
  rewardCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 25, flexDirection: 'row', alignItems: 'center', marginTop: 40, elevation: 15, shadowColor: '#000', shadowOpacity: 0.1, width: '100%' },
  rewardTitle: { fontSize: 18 * scale, fontFamily: "PoppinsBold", color: "#1C1C1C" },
  rewardSub: { fontSize: 13 * scale, fontFamily: "PoppinsMedium", color: "#666", marginTop: 2 },
  confettiContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  confetti: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFD700', opacity: 0.8 },
});
