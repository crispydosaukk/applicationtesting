import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, Dimensions, TextInput, TouchableOpacity, Modal, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";
import { fetchProducts } from "../../services/productService";
import { addToCart } from "../../services/cartService";
import AppHeader from "../AppHeader";
import BottomBar from "../BottomBar";
import MenuModal from "../MenuModal";

const { width } = Dimensions.get("window");

export default function Products({ route, navigation }) {
  const { userId, categoryId } = route.params;

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchText, setSearchText] = useState("");

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [cartItems, setCartItems] = useState({});
  const [notes, setNotes] = useState({});
  const [popupIndex, setPopupIndex] = useState(0);
  const [popupVisible, setPopupVisible] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);

  const bannerHeight = useRef(new Animated.Value(60)).current;
  const [bannerVisible, setBannerVisible] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [textIndex, setTextIndex] = useState(0);
  const animatedTexts = ["Earn £0.25 on every order", "Refer & earn £0.25", "£0.25 welcome bonus"];

  useEffect(() => {
    const t = () => {
      fadeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.delay(1500),
        Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true })
      ]).start(() => {
        setTextIndex((p) => (p + 1) % animatedTexts.length);
        t();
      });
    };
    t();
  }, []);

  const collapseBanner = () => {
    Animated.timing(bannerHeight, { toValue: 0, duration: 300, useNativeDriver: false }).start(() => setBannerVisible(false));
  };
  const expandBanner = () => {
    setBannerVisible(true);
    Animated.timing(bannerHeight, { toValue: 60, duration: 300, useNativeDriver: false }).start();
  };

  useEffect(() => {
    (async () => {
      const u = await AsyncStorage.getItem("user");
      if (u) setUser(JSON.parse(u));
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const data = await fetchProducts(userId, categoryId);
      setProducts(data);
      setFilteredProducts(data);
      setLoading(false);
      const stored = await AsyncStorage.getItem("cart");
      if (stored) {
        const parsed = JSON.parse(stored);
        setCartItems(parsed[userId] || {});
      }
    })();
  }, [userId, categoryId]);

  useEffect(() => {
    if (!searchText.trim()) setFilteredProducts(products);
    else setFilteredProducts(products.filter((i) => i.name.toLowerCase().includes(searchText.toLowerCase())));
  }, [searchText, products]);

  const increment = (id) => setCartItems((p) => ({ ...p, [id]: (p[id] || 0) + 1 }));

  const decrement = (id) =>
    setCartItems((p) => {
      if (!p[id]) return p;
      const q = p[id] - 1;
      const u = { ...p };
      if (q <= 0) delete u[id];
      else u[id] = q;
      return u;
    });

  const startCheckout = () => {
    const ids = Object.keys(cartItems);
    if (ids.length === 0) return alert("Please add products");
    setPopupIndex(0);
    setNoteInput(notes[ids[0]] || "");
    setPopupVisible(true);
  };

  const handleNextPopup = async () => {
    const ids = Object.keys(cartItems);
    const pid = ids[popupIndex];
    setNotes((p) => ({ ...p, [pid]: noteInput }));

    const prod = products.find((p) => p.id == pid);
    if (prod && user) {
      await addToCart({
        customer_id: user.id,
        user_id: prod.user_id,
        product_id: prod.id,
        product_name: prod.name,
        product_price: prod.price,
        product_tax: 0,
        product_quantity: cartItems[pid],
        textfield: noteInput || ""
      });
    }

    if (popupIndex < ids.length - 1) {
      const next = popupIndex + 1;
      setPopupIndex(next);
      setNoteInput(notes[ids[next]] || "");
    } else {
      setPopupVisible(false);
      navigation.navigate("CartSummary", { cartItems, notes, user });
    }
  };

  const handleBackPopup = () => {
    if (popupIndex === 0) return;
    const ids = Object.keys(cartItems);
    const prev = popupIndex - 1;
    setPopupIndex(prev);
    setNoteInput(notes[ids[prev]] || "");
  };

  const renderItem = ({ item }) => {
    const qty = cartItems[item.id] || 0;

    return (
      <View style={styles.card}>
        <Image source={item.image ? { uri: item.image } : require("../../assets/restaurant.png")} style={styles.cardImg} />
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>£{item.price}</Text>

            {qty > 0 ? (
              <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => decrement(item.id)}>
                  <Ionicons name="remove-outline" size={18} color="#000" />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{qty}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => increment(item.id)}>
                  <Ionicons name="add-outline" size={18} color="#000" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addBtn} onPress={() => increment(item.id)}>
                <Ionicons name="add-outline" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const selectedIds = Object.keys(cartItems);
  const currentProduct = popupVisible && selectedIds.length > 0 ? products.find((p) => p.id == selectedIds[popupIndex]) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader user={user} navigation={navigation} cartItems={cartItems} onMenuPress={() => setMenuVisible(true)} />

      {bannerVisible ? (
        <Animated.View style={[styles.banner, { height: bannerHeight }]}>
          <View style={styles.bannerLeft}>
            <Ionicons name="gift-outline" size={18} color="#fff" />
            <Animated.Text style={[styles.bannerText, { opacity: fadeAnim }]}>{animatedTexts[textIndex]}</Animated.Text>
          </View>
          <TouchableOpacity onPress={collapseBanner}><Ionicons name="close-circle" size={22} color="#fff" /></TouchableOpacity>
        </Animated.View>
      ) : (
        <TouchableOpacity style={styles.bannerChip} onPress={expandBanner}>
          <Ionicons name="gift-outline" size={18} color="#fff" />
          <Animated.Text style={[styles.bannerChipText, { opacity: fadeAnim }]}>{animatedTexts[textIndex]}</Animated.Text>
        </TouchableOpacity>
      )}

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color="#777" />
        <TextInput style={styles.searchInput} placeholder="Search products..." value={searchText} onChangeText={setSearchText} placeholderTextColor="#aaa" />
      </View>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList data={filteredProducts} renderItem={renderItem} keyExtractor={(i) => i.id.toString()} contentContainerStyle={{ paddingBottom: 160 }} />
      )}

      {selectedIds.length > 0 && (
        <View style={styles.checkoutWrap}>
          <TouchableOpacity style={styles.checkoutBtn} onPress={startCheckout}>
            <Ionicons name="cart-outline" size={20} color="#fff" />
            <Text style={styles.checkoutText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
      )}

      <MenuModal visible={menuVisible} setVisible={setMenuVisible} user={user} navigation={navigation} />
      <BottomBar navigation={navigation} />

      <Modal visible={popupVisible} transparent animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popupBox}>
            {currentProduct && (
              <>
                <Text style={styles.popupTitle}>{currentProduct.name}</Text>
                <Text style={styles.popupPrice}>£{currentProduct.price}</Text>
                <TextInput style={styles.popupInput} placeholder="Special instructions (optional)" value={noteInput} onChangeText={setNoteInput} multiline />
                <View style={styles.popupRow}>
                  {popupIndex > 0 && (
                    <TouchableOpacity style={styles.popupBtn} onPress={handleBackPopup}>
                      <Text style={styles.popupBtnText}>Back</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.popupBtn} onPress={handleNextPopup}>
                    <Text style={styles.popupBtnText}>{popupIndex === selectedIds.length - 1 ? "Finish" : "Next"}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  banner: { width: "100%", backgroundColor: "#28a745", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, overflow: "hidden" },
  bannerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  bannerText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  bannerChip: { alignSelf: "center", flexDirection: "row", alignItems: "center", backgroundColor: "#28a745", paddingVertical: 6, paddingHorizontal: 14, borderRadius: 6, marginTop: 10, gap: 6 },
  bannerChipText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  searchBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, height: 46, backgroundColor: "#fff", borderRadius: 6, elevation: 3, marginHorizontal: 16, marginTop: 14 },
  searchInput: { marginLeft: 10, flex: 1, fontSize: 14, color: "#222" },

  card: { flexDirection: "row", backgroundColor: "#fff", marginHorizontal: 16, marginVertical: 8, borderRadius: 6, padding: 12, elevation: 3 },
  cardImg: { width: 110, height: 110, borderRadius: 6 },
  cardBody: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#222" },
  cardDesc: { fontSize: 13, color: "#666", marginTop: 4 },

  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  price: { fontSize: 16, fontWeight: "700", color: "#28a745" },

  qtyRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  qtyBtn: { backgroundColor: "#eaeaea", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  qtyText: { fontSize: 15, fontWeight: "700" },

  addBtn: { backgroundColor: "#28a745", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },

  checkoutWrap: { position: "absolute", bottom: 90, width: "100%", paddingHorizontal: 16 },
  checkoutBtn: { backgroundColor: "#28a745", paddingVertical: 14, borderRadius: 6, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  checkoutText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  popupOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  popupBox: { width: "80%", backgroundColor: "#fff", padding: 20, borderRadius: 6 },
  popupTitle: { fontSize: 18, fontWeight: "700" },
  popupPrice: { fontSize: 16, fontWeight: "700", color: "#28a745", marginBottom: 10 },
  popupInput: { borderWidth: 1, borderColor: "#ccc", minHeight: 60, borderRadius: 6, padding: 10, textAlignVertical: "top", marginBottom: 20 },
  popupRow: { flexDirection: "row", justifyContent: "space-between" },
  popupBtn: { backgroundColor: "#28a745", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6 },
  popupBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" }
});
