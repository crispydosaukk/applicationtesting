import React, { useEffect, useState, useRef, useCallback } from "react";
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
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";
import { RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import useRefresh from "../../hooks/useRefresh";
import { fetchProducts } from "../../services/productService";
import { addToCart, getCart, removeFromCart } from "../../services/cartService";
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
  const [popupTargetIds, setPopupTargetIds] = useState(null);
  const [updating, setUpdating] = useState({});
  const [pending, setPending] = useState({});
  const [noteInput, setNoteInput] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);

  const bannerHeight = useRef(new Animated.Value(40 * scale)).current;
  const [bannerVisible, setBannerVisible] = useState(true);
  const CONTAINS_ICONS = {
    Dairy: require("../../assets/contains/Dairy.png"),
    Gluten: require("../../assets/contains/Gluten.png"),
    Mild: require("../../assets/contains/Mild.png"),
    Nuts: require("../../assets/contains/Nuts.png"),
    Sesame: require("../../assets/contains/Sesame.png"),
    Vegan: require("../../assets/contains/Vegan.png"),
    Vegetarian: require("../../assets/contains/Vegetarian.png"),
  };

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

  // load products + cart — also re-run when `user` becomes available so quantities show immediately
  useEffect(() => {
    (async () => {
      const data = await fetchProducts(userId, categoryId);
      const list = Array.isArray(data) ? data : [];
      setProducts(list);
      setFilteredProducts(list);
      setLoading(false);

      try {
        const uid = user?.id ?? user?.customer_id;
        if (uid) {
          const res = await getCart(uid);
          if (res?.status === 1 && Array.isArray(res.data)) {
            const map = {};
            res.data.forEach((i) => {
              if (i.product_quantity > 0) map[i.product_id] = i.product_quantity;
            });
            setCartItems(map);
            return;
          }
        }

        const stored = await AsyncStorage.getItem("cart");
        if (stored) {
          const parsed = JSON.parse(stored);
          setCartItems(parsed[userId] || {});
        }
      } catch (e) {
        console.warn("Failed to load cart on init", e);
      }
    })();
  }, [userId, categoryId, user]);

  // Reload cart from AsyncStorage whenever this screen is focused
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          // Prefer server-side cart if user is signed in (keeps behavior like Categories)
          const uid = user?.id ?? user?.customer_id;
          if (uid) {
            const res = await getCart(uid);
            if (!active) return;
            if (res?.status === 1 && Array.isArray(res.data)) {
              const map = {};
              res.data.forEach((i) => {
                if (i.product_quantity > 0) map[i.product_id] = i.product_quantity;
              });
              setCartItems(map);
              // server is authoritative; clear any pending flags
              setPending({});
              return;
            }
          }

          // Fallback to local storage
          const stored = await AsyncStorage.getItem("cart");
          if (!active) return;
          if (stored) {
            const parsed = JSON.parse(stored);
            setCartItems(parsed[userId] || {});
          } else {
            setCartItems({});
          }
        } catch (e) {
          console.warn("Failed to load cart on focus", e);
        }
      })();

      return () => {
        active = false;
      };
    }, [userId])
  );

  // Persist cart state to AsyncStorage whenever it changes
  useEffect(() => {
    (async () => {
      try {
        if (!userId) return;
        const stored = await AsyncStorage.getItem("cart");
        const parsed = stored ? JSON.parse(stored) : {};
        parsed[userId] = cartItems || {};
        await AsyncStorage.setItem("cart", JSON.stringify(parsed));
      } catch (e) {
        console.warn("Failed to persist cart", e);
      }
    })();
  }, [cartItems, userId]);

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

  const { refreshing, onRefresh } = useRefresh(async () => {
    // Reload products
    const data = await fetchProducts(userId, categoryId);
    const list = Array.isArray(data) ? data : [];
    setProducts(list);
    setFilteredProducts(list);
    // Reload cart: prefer server cart when signed-in (keeps parity with Categories)
    try {
      const uid = user?.id ?? user?.customer_id;
      if (uid) {
        const res = await getCart(uid);
        if (res?.status === 1 && Array.isArray(res.data)) {
          const map = {};
          res.data.forEach((i) => {
            if (i.product_quantity > 0) map[i.product_id] = i.product_quantity;
          });
          setCartItems(map);
        }
      } else {
        const stored = await AsyncStorage.getItem("cart");
        if (stored) {
          const parsed = JSON.parse(stored);
          setCartItems(parsed[userId] || {});
        }
      }
    } catch (e) {
      console.warn("Failed to reload cart on refresh", e);
    }
  });


  const increment = async (id) => {
    // optimistic update
    const prev = cartItems[id] || 0;
    setCartItems((p) => ({ ...p, [id]: prev + 1 }));
    // If this item is pending (added locally, waiting for special-instructions confirmation), don't sync yet
    if (!user || pending[id]) return;

    setUpdating((s) => ({ ...s, [id]: true }));
    try {
      const prod = products.find((p) => p.id == id);
      if (!prod) return;
      await addToCart({
        customer_id: user.id,
        user_id: prod.user_id,
        product_id: prod.id,
        product_name: prod.name,
        product_price: prod.price,
        product_tax: 0,
        product_quantity: 1,
        textfield: "",
      });
    } catch (e) {
      console.warn("Failed to increment cart item", e);
      // revert
      setCartItems((p) => ({ ...p, [id]: prev }));
    } finally {
      setUpdating((s) => {
        const n = { ...s };
        delete n[id];
        return n;
      });
    }
  };

  const decrement = async (id) => {
    const prev = cartItems[id] || 0;
    if (!prev) return;

    const nextQty = prev - 1;
    // optimistic update
    setCartItems((p) => {
      const u = { ...p };
      if (nextQty <= 0) delete u[id];
      else u[id] = nextQty;
      return u;
    });
    // If this item is pending (not yet synced to server), just update local state
    if (!user || pending[id]) return;

    setUpdating((s) => ({ ...s, [id]: true }));
    try {
      const prod = products.find((p) => p.id == id);
      if (!prod) return;
      // send delta -1
      await addToCart({
        customer_id: user.id,
        user_id: prod.user_id,
        product_id: prod.id,
        product_name: prod.name,
        product_price: prod.price,
        product_tax: 0,
        product_quantity: -1,
        textfield: "",
      });
    } catch (e) {
      console.warn("Failed to decrement cart item", e);
      // revert
      setCartItems((p) => ({ ...p, [id]: prev }));
    } finally {
      setUpdating((s) => {
        const n = { ...s };
        delete n[id];
        return n;
      });
    }
  };

  const startCheckout = () => {
    const ids = Object.keys(cartItems);
    if (ids.length === 0) return alert("Please add some items first.");
    setPopupTargetIds(null);
    setPopupIndex(0);
    setNoteInput(notes[ids[0]] || "");
    setPopupVisible(true);
  };

  // Add item locally and open popup for that single item
  const addAndOpenPopup = async (id) => {
    try {
      // 1. Check if ANY other restaurant has items in the cart (LocalStorage)
      const stored = await AsyncStorage.getItem("cart");
      const parsed = stored ? JSON.parse(stored) : {};

      // Filter out current restaurant and check if others have quantity > 0
      const otherRestaurants = Object.keys(parsed).filter(rid => rid != userId);
      const hasConflict = otherRestaurants.some(rid => {
        const items = parsed[rid];
        return Object.values(items).some(qty => qty > 0);
      });

      if (hasConflict) {
        Alert.alert(
          "Replace Cart Items?",
          "Your cart contains items from another restaurant. Do you want to discard them and start a new order with this restaurant?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Replace",
              style: "destructive",
              onPress: async () => {
                // Show a small loader or just proceed
                const uid = user?.id ?? user?.customer_id;

                if (uid) {
                  setLoading(true); // temporary show loader while clearing
                  try {
                    const res = await getCart(uid);
                    if (res?.status === 1 && Array.isArray(res.data)) {
                      // Remove everything from server
                      await Promise.all(
                        res.data.map(item => removeFromCart(item.cart_id || item.id))
                      );
                    }
                  } catch (err) {
                    console.log("Error clearing server cart", err);
                  }
                }

                // Clear everything locally
                await AsyncStorage.removeItem("cart");
                setCartItems({});
                setLoading(false);

                // Add the NEW item
                performAddItem(id);
              }
            }
          ]
        );
        return;
      }

      // No conflict, proceed normally
      performAddItem(id);

    } catch (e) {
      console.warn("Cart validation error", e);
      performAddItem(id); // fallback
    }
  };

  const performAddItem = (id) => {
    // mark pending so it won't sync until popup confirmation
    setCartItems((p) => ({ ...p, [id]: (p[id] || 0) + 1 }));
    setPending((s) => ({ ...s, [id]: true }));
    setPopupTargetIds([id]);
    setPopupIndex(0);
    setNoteInput(notes[id] || "");
    setPopupVisible(true);
  };

  const handleNextPopup = async () => {
    const ids = popupTargetIds || Object.keys(cartItems);
    const pid = ids[popupIndex];
    setNotes((p) => ({ ...p, [pid]: noteInput }));

    const prod = products.find((p) => p.id == pid);
    // If this is not the single-item add flow (popupTargetIds), persist cart items for checkout
    if (prod && user) {
      // If this product was locally added (pending), send full quantity to server now.
      if (pending[pid]) {
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
        // clear pending flag for this item
        setPending((s) => {
          const n = { ...s };
          delete n[pid];
          return n;
        });
      }
      // If not pending, we assume increments/decrements already synced with server
    }

    if (popupIndex < ids.length - 1) {
      const next = popupIndex + 1;
      setPopupIndex(next);
      setNoteInput(notes[ids[next]] || "");
    } else {
      setPopupVisible(false);
      // clear target ids if we were in single-item flow
      setPopupTargetIds(null);
      // if coming from single-item add flow, don't navigate away; otherwise, go to CartSummary
      if (!popupTargetIds) {
        navigation.navigate("CartSummary", { cartItems, notes, user });
      }
    }
  };

  const handleBackPopup = () => {
    if (popupIndex === 0) return;
    const ids = popupTargetIds || Object.keys(cartItems);
    const prev = popupIndex - 1;
    setPopupIndex(prev);
    setNoteInput(notes[ids[prev]] || "");
  };

  const selectedIds = Object.keys(cartItems);
  const popupIds = popupTargetIds || selectedIds;
  const currentProduct =
    popupVisible && popupIds.length > 0
      ? products.find((p) => p.id == popupIds[popupIndex])
      : null;

  const totalItemsInCart = Object.values(cartItems || {}).reduce((a, b) => a + b, 0);

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
          {Array.isArray(item.contains) && item.contains.length > 0 && (
            <View style={styles.containsRow}>
              {item.contains.map((c, index) => {
                const rawKey = String(c).trim();
                const key = rawKey.toLowerCase();

                const ICON_MAP = {
                  dairy: CONTAINS_ICONS.Dairy,
                  gluten: CONTAINS_ICONS.Gluten,
                  mild: CONTAINS_ICONS.Mild,
                  nuts: CONTAINS_ICONS.Nuts,
                  sesame: CONTAINS_ICONS.Sesame,
                  vegan: CONTAINS_ICONS.Vegan,
                  vegetarian: CONTAINS_ICONS.Vegetarian,
                };

                const iconSource = ICON_MAP[key];

                if (iconSource) {
                  return (
                    <Image
                      key={index}
                      source={iconSource}
                      style={styles.containsIcon}
                    />
                  );
                }

                // Fallback: Display text if icon is missing
                return (
                  <Text key={index} style={{ fontSize: 10, color: '#555', marginRight: 4 }}>{rawKey}</Text>
                );
              })}
            </View>
          )}

          <View style={styles.priceRow}>
            <Text style={styles.price}>£{item.price}</Text>

            {qty > 0 ? (
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => decrement(item.id)}
                  disabled={!!updating[item.id]}
                >
                  {updating[item.id] ? (
                    <ActivityIndicator size="small" />
                  ) : (
                    <Ionicons name="remove-outline" size={18 * scale} color="#000" />
                  )}
                </TouchableOpacity>

                <Text style={styles.qtyText}>{qty}</Text>

                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => increment(item.id)}
                  disabled={!!updating[item.id]}
                >
                  {updating[item.id] ? (
                    <ActivityIndicator size="small" />
                  ) : (
                    <Ionicons name="add-outline" size={18 * scale} color="#000" />
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => addAndOpenPopup(item.id)}
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />

      )}

      {/* Professional sticky 'Go to Cart' button */}
      {selectedIds.length > 0 && (
        <View
          style={[
            styles.checkoutWrap,
            { bottom: 66 + insets.bottom + 8 },
          ]}
        >
          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={() => navigation.navigate("CartSummary", { cartItems, notes, user })}
          >
            <Ionicons name="cart-outline" size={20 * scale} color="#ffffff" />
            <Text style={styles.checkoutText}>{`Go to Cart${totalItemsInCart > 0 ? ` (${totalItemsInCart})` : ""}`}</Text>
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
                onPress={() => {
                  setPopupVisible(false);
                  setPopupTargetIds(null);
                }}
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
                  <Text style={styles.popupSecondaryText}>Back</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.popupPrimaryBtn}
                onPress={handleNextPopup}
              >
                <Text style={styles.popupPrimaryText}>
                  {popupIndex === popupIds.length - 1 ? "Add to Cart" : "Continue"}
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

  containsRow: {
    flexDirection: "row",
    marginTop: 6,
    gap: 6,
    flexWrap: "wrap",
  },

  containsIcon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
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
