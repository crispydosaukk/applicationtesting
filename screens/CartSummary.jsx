import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Animated, Dimensions, RefreshControl, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import useRefresh from "../hooks/useRefresh";
import AppHeader from "./AppHeader";
import BottomBar from "./BottomBar";
import MenuModal from "./MenuModal";
import { getCart, addToCart, removeFromCart } from "../services/cartService";

const { width } = Dimensions.get("window");
const scale = width / 400;

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
    await refreshCart();
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

    setUpdating((s) => ({ ...s, [item.product_id]: true }));
    try {
      if (updated <= 0) {
        await removeFromCart(item.cart_id || item.id);
        setCartItems((prev) => {
          const next = { ...prev };
          delete next[item.product_id];
          return next;
        });
        setProducts((prev) => prev.filter((p) => p.product_id !== item.product_id));
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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (!loadingCart && products.length > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loadingCart, products.length]);

  return (
    <View style={styles.root}>
      <AppHeader
        user={user}
        navigation={navigation}
        cartItems={cartItems}
        onMenuPress={() => setMenuVisible(true)}
      />

      {loadingCart ? (
        <View style={styles.loaderFull}>
          <ActivityIndicator size="large" color="#FF2B5C" />
          <Text style={styles.loaderText}>Syncing your cart...</Text>
        </View>
      ) : products.length < 1 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.emptyImageWrap}>
            <Ionicons name="cart-outline" size={80} color="#DDD" />
          </View>
          <Text style={styles.emptyTitle}>Empty Plate?</Text>
          <Text style={styles.emptySubtitle}>
            Your cart is hungry. Explore our finest selection and add your favorites now!
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => navigation.navigate("Resturent")}
          >
            <LinearGradient colors={["#FF2B5C", "#FF6B8B"]} style={styles.browseGradient}>
              <Text style={styles.browseText}>Start Ordering</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={products}
            keyExtractor={(i) => String(i.product_id)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListHeaderComponent={() => (
              <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                <View style={styles.listHeader}>
                  <View style={styles.headerLeft}>
                    <Text style={styles.headerTitle}>Review Items</Text>
                    <Text style={styles.headerSub}>{products.length} {products.length === 1 ? 'item' : 'items'} in your bucket</Text>
                  </View>
                  <TouchableOpacity style={styles.addMoreBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="add-circle-outline" size={18} color="#FF2B5C" />
                    <Text style={styles.addMoreText}>Add more</Text>
                  </TouchableOpacity>
                </View>

                {/* Arrival Timer Card */}
                <View style={styles.etaCard}>
                  <LinearGradient colors={["#FFF", "#FAFAFA"]} style={styles.etaInner}>
                    <View style={styles.etaIconBg}>
                      <Ionicons name="time" size={24} color="#FF2B5C" />
                    </View>
                    <View style={styles.etaTextWrap}>
                      <Text style={styles.etaLabel}>Estimated Prep Time</Text>
                      <Text style={styles.etaValue}>20 - 25 Minutes</Text>
                    </View>
                    <View style={styles.arrivalBadge}>
                      <Text style={styles.arrivalText}>Freshly Prepared</Text>
                    </View>
                  </LinearGradient>
                </View>
              </Animated.View>
            )}
            renderItem={({ item }) => {
              const qty = item.product_quantity || 0;
              const price = Number(item.discount_price ?? item.product_price ?? 0);
              const total = calcTotal(price, qty);

              return (
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
                    <Text style={styles.itemPriceUnit}>£{price.toFixed(2)}</Text>
                  </View>

                  <View style={styles.actionCol}>
                    <View style={styles.qtyContainer}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => updateQty(item, -1)}
                        disabled={!!updating[item.product_id]}
                      >
                        {updating[item.product_id] ? (
                          <ActivityIndicator size="small" color="#FF2B5C" />
                        ) : (
                          <Ionicons name={qty === 1 ? "trash-outline" : "remove"} size={18} color="#FF2B5C" />
                        )}
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{qty}</Text>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => updateQty(item, 1)}
                        disabled={!!updating[item.product_id]}
                      >
                        <Ionicons name="add" size={18} color="#FF2B5C" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.totalTextSmall}>£{total}</Text>
                  </View>
                </View>
              );
            }}
            ListFooterComponent={() => (
              <View style={styles.billSummary}>
                <Text style={styles.billTitle}>Price Details</Text>
                <View style={styles.billCard}>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Item Total</Text>
                    <Text style={styles.billValue}>£{grandTotal}</Text>
                  </View>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Preparation Fee</Text>
                    <Text style={[styles.billValue, { color: '#16a34a' }]}>FREE</Text>
                  </View>
                  <View style={styles.billDivider} />
                  <View style={styles.billRow}>
                    <Text style={styles.grandLabel}>Amount Payable</Text>
                    <Text style={styles.grandValue}>£{grandTotal}</Text>
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

                {/* ULTIMATE BUSINESS CHECKOUT BAR */}
                <View style={styles.premiumCheckoutBar}>
                  <View style={styles.summaryLeft}>
                    <Text style={styles.itemCountText}>{products.length} {products.length === 1 ? 'Item' : 'Items'}</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.totalLabelSmall}>Total:</Text>
                      <Text style={styles.finalTotalText}>£{grandTotal}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.actionBtnPremium}
                    onPress={() => navigation.navigate("CheckoutScreen")}
                  >
                    <LinearGradient
                      colors={["#16a34a", "#15803d"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.btnGradient}
                    >
                      <Text style={styles.btnTextPremium}>Place Order</Text>
                      <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 8 }} />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />


        </View>
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
  root: { flex: 1, backgroundColor: "#F8F8F8" },

  loaderFull: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 15, fontFamily: 'PoppinsMedium', color: '#666' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyImageWrap: { width: 140, height: 140, backgroundColor: '#EEE', borderRadius: 70, alignItems: 'center', justifyContent: 'center', marginBottom: 25 },
  emptyTitle: { fontSize: 22 * scale, fontFamily: 'PoppinsBold', color: '#1C1C1C' },
  emptySubtitle: { fontSize: 13 * scale, fontFamily: 'PoppinsMedium', color: '#777', textAlign: 'center', marginTop: 10, lineHeight: 20 },
  browseBtn: { marginTop: 30, borderRadius: 12, overflow: 'hidden', elevation: 5 },
  browseGradient: { paddingVertical: 14, paddingHorizontal: 30 },
  browseText: { color: '#FFF', fontFamily: 'PoppinsBold', fontSize: 15 * scale },

  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', padding: 20, paddingTop: 15 },
  headerTitle: { fontSize: 20 * scale, fontFamily: 'PoppinsBold', color: '#1C1C1C' },
  headerSub: { fontSize: 12 * scale, fontFamily: 'PoppinsMedium', color: '#888' },
  addMoreBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,43,92,0.08)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  addMoreText: { fontSize: 13 * scale, fontFamily: 'PoppinsBold', color: '#FF2B5C', marginLeft: 5 },

  etaCard: { marginHorizontal: 20, marginBottom: 15, borderRadius: 12, overflow: 'hidden', elevation: 4 },
  etaInner: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  etaIconBg: { width: 45, height: 45, borderRadius: 10, backgroundColor: 'rgba(255,43,92,0.1)', alignItems: 'center', justifyContent: 'center' },
  etaTextWrap: { flex: 1, marginLeft: 15 },
  etaLabel: { fontSize: 11 * scale, fontFamily: 'PoppinsBold', color: '#AAA', letterSpacing: 0.5 },
  etaValue: { fontSize: 15 * scale, fontFamily: 'PoppinsBold', color: '#1C1C1C' },
  arrivalBadge: { backgroundColor: '#FF2B5C', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  arrivalText: { fontSize: 10 * scale, fontFamily: 'PoppinsBold', color: '#FFF' },

  itemRow: { flexDirection: 'row', backgroundColor: '#FFF', marginHorizontal: 20, marginVertical: 6, borderRadius: 12, padding: 16, elevation: 2 },
  itemInfo: { flex: 1, paddingRight: 10 },
  nameHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  itemName: { fontSize: 15 * scale, fontFamily: 'PoppinsBold', color: '#1C1C1C' },
  noteBox: { backgroundColor: '#F9F9F9', padding: 10, borderRadius: 8, marginTop: 8, borderLeftWidth: 3, borderLeftColor: '#DDD' },
  itemNote: { fontSize: 12 * scale, fontFamily: 'PoppinsMedium', fontStyle: 'italic', color: '#666' },
  itemPriceUnit: { fontSize: 14 * scale, fontFamily: 'PoppinsSemiBold', color: '#FF2B5C', marginTop: 8 },

  actionCol: { alignItems: 'flex-end', justifyContent: 'space-between' },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F8F8', borderRadius: 10, padding: 4, borderWidth: 1, borderColor: '#EEE' },
  actionBtn: { width: 30, height: 30, backgroundColor: '#FFF', borderRadius: 8, alignItems: 'center', justifyContent: 'center', elevation: 1 },
  qtyText: { fontSize: 14 * scale, fontFamily: 'PoppinsBold', color: '#1C1C1C', marginHorizontal: 12 },
  totalTextSmall: { fontSize: 15 * scale, fontFamily: 'PoppinsBold', color: '#1C1C1C', marginTop: 10 },

  billSummary: { padding: 20, paddingBottom: 20 },
  billTitle: { fontSize: 18 * scale, fontFamily: 'PoppinsBold', color: '#1C1C1C', marginBottom: 12 },
  billCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 18, elevation: 3 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6 },
  billLabel: { fontSize: 14 * scale, fontFamily: 'PoppinsMedium', color: '#777' },
  billValue: { fontSize: 14 * scale, fontFamily: 'PoppinsBold', color: '#1C1C1C' },
  billDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
  grandLabel: { fontSize: 16 * scale, fontFamily: 'PoppinsBold', color: '#1C1C1C' },
  grandValue: { fontSize: 18 * scale, fontFamily: 'PoppinsBold', color: '#16a34a' },

  safetyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', marginTop: 15, padding: 15, borderRadius: 12 },
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
});
