import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
  TextInput,
  TouchableOpacity,
  Modal,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";

import { fetchProducts } from "../../services/productService";
import { addToCart } from "../../services/cartService";
import AppHeader from "../AppHeader";
import BottomBar from "../BottomBar";
import MenuModal from "../MenuModal";

const { width } = Dimensions.get("window");
const scale = width / 400;

export default function Products({ route, navigation }) {
  const { userId, categoryId } = route.params;
  const insets = useSafeAreaInsets();

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

  const bannerHeight = useRef(new Animated.Value(40 * scale)).current;
  const [bannerVisible, setBannerVisible] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [textIndex, setTextIndex] = useState(0);
  const animatedTexts = [
    "EARN £0.25 ON EVERY ORDER",
    "REFER & EARN £0.25",
    "£0.25 WELCOME BONUS",
  ];

  const highlightAmount = (text) => {
  const regex = /(£\s?0\.25|£0\.25)/i;
  const parts = text.split(regex);

  return (
    <Text style={styles.bannerText}>
      {parts[0]}
      {parts[1] && <Text style={styles.amountHighlight}>{parts[1]}</Text>}
      {parts[2]}
    </Text>
  );
};


  // animated banner text
  useEffect(() => {
    const run = () => {
      fadeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTextIndex((p) => (p + 1) % animatedTexts.length);
        run();
      });
    };
    run();
  }, []);

  const collapseBanner = () => {
    Animated.timing(bannerHeight, {
      toValue: 0,
      duration: 250,
      useNativeDriver: false,
    }).start(() => setBannerVisible(false));
  };

  const expandBanner = () => {
    setBannerVisible(true);
    Animated.timing(bannerHeight, {
      toValue: 40 * scale,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  // load user
  useEffect(() => {
    (async () => {
      const u = await AsyncStorage.getItem("user");
      if (u) setUser(JSON.parse(u));
    })();
  }, []);

  // load products + cart
  useEffect(() => {
    (async () => {
      const data = await fetchProducts(userId, categoryId);
      const list = Array.isArray(data) ? data : [];
      setProducts(list);
      setFilteredProducts(list);
      setLoading(false);

      const stored = await AsyncStorage.getItem("cart");
      if (stored) {
        const parsed = JSON.parse(stored);
        setCartItems(parsed[userId] || {});
      }
    })();
  }, [userId, categoryId]);

  // search
  useEffect(() => {
    if (!searchText.trim()) setFilteredProducts(products);
    else {
      setFilteredProducts(
        products.filter((i) =>
          i.name.toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }
  }, [searchText, products]);

  const increment = (id) =>
    setCartItems((p) => ({ ...p, [id]: (p[id] || 0) + 1 }));

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
    if (ids.length === 0) return alert("Please add some items first.");
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
        textfield: noteInput || "",
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

  const selectedIds = Object.keys(cartItems);
  const currentProduct =
    popupVisible && selectedIds.length > 0
      ? products.find((p) => p.id == selectedIds[popupIndex])
      : null;

  const renderItem = ({ item }) => {
    const qty = cartItems[item.id] || 0;
    return (
      <View style={styles.card}>
        <Image
          source={
            item.image
              ? { uri: item.image }
              : require("../../assets/restaurant.png")
          }
          style={styles.cardImg}
        />
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name}
          </Text>

          {!!item.description && (
            <Text style={styles.cardDesc} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.priceRow}>
            <Text style={styles.price}>£{item.price}</Text>

            {qty > 0 ? (
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => decrement(item.id)}
                >
                  <Ionicons name="remove-outline" size={18 * scale} color="#000" />
                </TouchableOpacity>

                <Text style={styles.qtyText}>{qty}</Text>

                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => increment(item.id)}
                >
                  <Ionicons name="add-outline" size={18 * scale} color="#000" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => increment(item.id)}
              >
                <Ionicons name="add-outline" size={20 * scale} color="#fff" />
                <Text style={styles.addText}>ADD</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.safe}>
      <AppHeader
        user={user}
        navigation={navigation}
        cartItems={cartItems}
        onMenuPress={() => setMenuVisible(true)}
      />

      {/* Offer banner */}
      {bannerVisible ? (
        <Animated.View style={[styles.banner, { height: bannerHeight }]}>
          <View style={styles.bannerLeft}>
            <Ionicons name="gift-outline" size={18 * scale} color="#ffffff" />
            <Animated.View style={{ opacity: fadeAnim }}>
              {highlightAmount(animatedTexts[textIndex])}
            </Animated.View>
          </View>

          <TouchableOpacity onPress={collapseBanner}>
            <Ionicons name="close-circle" size={22 * scale} color="#ffffff" />
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <TouchableOpacity style={styles.bannerChip} onPress={expandBanner}>
          <Ionicons name="gift-outline" size={18 * scale} color="#ffffff" />
          <Animated.Text
            style={[styles.bannerChipText, { opacity: fadeAnim }]}
          >
            Click here for offers
          </Animated.Text>
        </TouchableOpacity>
      )}

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18 * scale} color="#777777" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search dishes..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#aaaaaa"
        />
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderItem}
          keyExtractor={(i) => i.id.toString()}
          contentContainerStyle={{ paddingBottom: 180 }}
        />
      )}

      {/* Checkout sticky */}
      {selectedIds.length > 0 && (
        <View
          style={[
            styles.checkoutWrap,
            { bottom: 66 + insets.bottom + 8 },
          ]}
        >
          <TouchableOpacity style={styles.checkoutBtn} onPress={startCheckout}>
            <Ionicons name="cart-outline" size={20 * scale} color="#ffffff" />
            <Text style={styles.checkoutText}>Review Order</Text>
          </TouchableOpacity>
        </View>
      )}

      <MenuModal
        visible={menuVisible}
        setVisible={setMenuVisible}
        user={user}
        navigation={navigation}
      />

      {/* Notes popup */}
      <Modal visible={popupVisible} transparent animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popupBox}>
            {/* TOP ROW RESTORED EXACTLY LIKE BEFORE */}
            <View style={styles.popupTopRow}>
              <TouchableOpacity
                onPress={() => setPopupVisible(false)}
                style={styles.popupBackIconWrap}
              >
                <Ionicons name="arrow-back" size={20 * scale} color="#222222" />
              </TouchableOpacity>

              <Text style={styles.popupTopTitle}>Special Instructions</Text>
            </View>

            {/* NAME LEFT, PRICE RIGHT (YOUR REQUEST) */}
            {currentProduct && (
              <View style={styles.popupTitleRow}>
                <Text style={styles.popupTitle}>{currentProduct.name}</Text>
                <Text style={styles.popupPrice}>£{currentProduct.price}</Text>
              </View>
            )}

            <Text style={styles.popupHint}>
              Enter any instructions like spice level, allergies or packing.
            </Text>

            <TextInput
              style={styles.popupInput}
              placeholder="Type your instructions..."
              value={noteInput}
              onChangeText={setNoteInput}
              multiline
              placeholderTextColor="#999999"
            />

            {/* BUTTONS — PROFESSIONAL NAMES */}
            <View style={styles.popupRow}>
              {popupIndex > 0 && (
                <TouchableOpacity
                  style={styles.popupSecondaryBtn}
                  onPress={handleBackPopup}
                >
                  <Text style={styles.popupSecondaryText}>Previous</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.popupPrimaryBtn}
                onPress={handleNextPopup}
              >
                <Text style={styles.popupPrimaryText}>
                  {popupIndex === selectedIds.length - 1
                    ? "Proceed to Cart"
                    : "Next Item"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomBar navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f5" },

  amountHighlight: {
  color: "#ffea63",         // GOLD
  fontWeight: "900",
  textShadowColor: "rgba(0,0,0,0.3)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
},

  banner: {
    width: "100%",
    backgroundColor: "#2faa3f",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  bannerLeft: { flexDirection: "row", alignItems: "center" },
  bannerText: {
    color: "#ffffff",
    fontSize: 13 * scale,
    fontWeight: "700",
    marginLeft: 8,
    maxWidth: width * 0.7,
  },
  bannerChip: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2faa3f",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 5,
    marginTop: 10,
  },
  bannerChipText: {
    color: "#ffffff",
    fontSize: 13 * scale,
    fontWeight: "600",
    marginLeft: 6,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 46,
    backgroundColor: "#ffffff",
    borderRadius: 5,
    elevation: 3,
    marginHorizontal: 16,
    marginTop: 14,
  },
  searchInput: {
    marginLeft: 10,
    flex: 1,
    fontSize: 14 * scale,
    color: "#222222",
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 5,
    padding: 12,
    elevation: 3,
  },
  cardImg: {
    width: 110,
    height: 110,
    borderRadius: 5,
    resizeMode: "contain",
    backgroundColor: "#fff",
  },

  cardBody: { flex: 1, marginLeft: 12 },
  cardTitle: {
    fontSize: 15.5 * scale,
    fontWeight: "700",
    color: "#222222",
  },
  cardDesc: {
    fontSize: 13 * scale,
    color: "#666666",
    marginTop: 4,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  price: {
    fontSize: 16 * scale,
    fontWeight: "700",
    color: "#28a745",
  },

  qtyRow: { flexDirection: "row", alignItems: "center" },
  qtyBtn: {
    backgroundColor: "#eeeeee",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  qtyText: {
    fontSize: 15 * scale,
    fontWeight: "700",
    marginHorizontal: 8,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28a745",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  addText: {
    color: "#ffffff",
    fontSize: 13 * scale,
    fontWeight: "700",
    marginLeft: 4,
  },

  checkoutWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  checkoutBtn: {
    backgroundColor: "#28a745",
    paddingVertical: 13,
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  checkoutText: {
    color: "#ffffff",
    fontSize: 15 * scale,
    fontWeight: "700",
    marginLeft: 8,
  },

  /* POPUP */
  popupOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  popupBox: {
    width: "88%",
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 5,
    elevation: 10,
  },

  popupTopRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },

  popupBackIconWrap: { padding: 4, marginRight: 6 },

  popupTopTitle: {
    fontSize: 14 * scale,
    fontWeight: "600",
    color: "#555555",
  },

  popupTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  popupTitle: {
    fontSize: 17 * scale,
    fontWeight: "700",
    color: "#222222",
    flex: 1,
  },

  popupPrice: {
    fontSize: 15 * scale,
    fontWeight: "700",
    color: "#28a745",
  },

  popupHint: {
    fontSize: 12.5 * scale,
    color: "#777777",
    marginBottom: 8,
  },

  popupInput: {
    borderWidth: 1,
    borderColor: "#dddddd",
    minHeight: 80,
    borderRadius: 5,
    padding: 10,
    textAlignVertical: "top",
    fontSize: 13 * scale,
    color: "#222222",
    marginBottom: 16,
  },

  popupRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },

  popupSecondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cccccc",
    marginRight: 8,
  },

  popupSecondaryText: {
    fontSize: 13 * scale,
    fontWeight: "600",
    color: "#444444",
  },

  popupPrimaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#28a745",
  },

  popupPrimaryText: {
    fontSize: 13.5 * scale,
    fontWeight: "700",
    color: "#ffffff",
  },
});
