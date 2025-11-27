// Products.js
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

  // ⭐ Reward Banner Animation (height)
  const [bannerVisible, setBannerVisible] = useState(true);
  const bannerHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(bannerHeight, {
      toValue: 70,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, []);

  const collapseBanner = () => {
    Animated.timing(bannerHeight, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => setBannerVisible(false));
  };

  const expandBanner = () => {
    setBannerVisible(true);
    Animated.timing(bannerHeight, {
      toValue: 70,
      duration: 350,
      useNativeDriver: false,
    }).start();
  };

  // ⭐ Reward Text Animation (fade + rotate messages)
  const animatedTexts = [
    "Earn £0.25 on every order",
    "Loyalty points earn £0.25 on referring a friend",
    "Earn £0.25 welcome gift on first sign up",
  ];
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const animateText = () => {
      fadeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTextIndex((prev) => (prev + 1) % animatedTexts.length);
        animateText();
      });
    };
    animateText();
  }, [fadeAnim]);

  // Load user
  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    };
    loadUser();
  }, []);

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts(userId, categoryId);
        setProducts(data);
        setFilteredProducts(data);

        const storedCart = await AsyncStorage.getItem("cart");
        if (storedCart) {
          const parsedCart = JSON.parse(storedCart);
          const cartForThisUser = parsedCart[userId] || {};
          setCartItems(cartForThisUser);
        }
      } catch (err) {
        console.log("Product Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [userId, categoryId]);

  // Search filter
  useEffect(() => {
    if (!searchText.trim()) setFilteredProducts(products);
    else {
      const filtered = products.filter((item) =>
        item.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchText, products]);

  const increment = (id) => {
    setCartItems((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const decrement = (id) => {
    setCartItems((prev) => {
      if (!prev[id]) return prev;
      const newQty = prev[id] - 1;
      const updated = { ...prev };
      if (newQty <= 0) delete updated[id];
      else updated[id] = newQty;
      return updated;
    });
  };

  const startCheckout = () => {
    const selectedIds = Object.keys(cartItems);
       if (selectedIds.length === 0) {
      alert("Please add at least one product.");
      return;
    }
    setPopupIndex(0);
    setNoteInput(notes[selectedIds[0]] || "");
    setPopupVisible(true);
  };

  const handleNextPopup = async () => {
    const selectedIds = Object.keys(cartItems);
    const currentProductId = selectedIds[popupIndex];

    setNotes((prev) => ({ ...prev, [currentProductId]: noteInput }));

    const currentProduct = products.find((p) => p.id == currentProductId);
    if (currentProduct && user) {
      try {
        await addToCart({
          customer_id: user.id,
          user_id: currentProduct.user_id,
          product_id: currentProduct.id,
          product_name: currentProduct.name,
          product_price: currentProduct.price,
          product_tax: 0,
          product_quantity: cartItems[currentProductId],
          textfield: noteInput || "",
        });
      } catch (err) {
        console.log("Error saving to cart:", err);
      }
    }

    if (popupIndex < selectedIds.length - 1) {
      const nextIndex = popupIndex + 1;
      setPopupIndex(nextIndex);
      const nextProductId = selectedIds[nextIndex];
      setNoteInput(notes[nextProductId] || "");
    } else {
      setPopupVisible(false);
      navigation.navigate("CartSummary", { cartItems, notes, user });
    }
  };

  const handleBackPopup = () => {
    const selectedIds = Object.keys(cartItems);
    if (popupIndex === 0) return;
    const prevIndex = popupIndex - 1;
    setPopupIndex(prevIndex);
    const prevProductId = selectedIds[prevIndex];
    setNoteInput(notes[prevProductId] || "");
  };

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
          style={styles.image}
        />

        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Ionicons
              name="fast-food-outline"
              size={18}
              color="#28a745"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
          </View>

          <Text style={styles.desc} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.priceRow}>
            <Ionicons
              name="pricetag-outline"
              size={16}
              color="#28a745"
              style={{ marginRight: 4 }}
            />
            <Text style={styles.price}>£{item.price}</Text>
          </View>
        </View>

        <View style={styles.counterContainer}>
          {qty > 0 ? (
            <View style={styles.counterRow}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => decrement(item.id)}
              >
                <Ionicons name="remove-outline" size={18} color="#000" />
              </TouchableOpacity>

              <Text style={styles.quantity}>{qty}</Text>

              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => increment(item.id)}
              >
                <Ionicons name="add-outline" size={18} color="#000" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => increment(item.id)}
            >
              <Ionicons name="add-outline" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const selectedProductIds = Object.keys(cartItems);
  const currentProduct =
    popupVisible && selectedProductIds.length > 0
      ? products.find((p) => p.id == selectedProductIds[popupIndex])
      : null;

  return (
    <View style={styles.container}>
      <AppHeader
        user={user}
        navigation={navigation}
        cartItems={cartItems}
        onMenuPress={() => setMenuVisible(true)}
      />

      {/* ⭐ REWARD BANNER ANIMATED */}
      {bannerVisible ? (
        <Animated.View
          style={[styles.rewardBanner, { height: bannerHeight }]}
        >
          <View style={styles.rewardLeft}>
            <Ionicons
              name="gift-outline"
              size={22}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Animated.Text
              style={[styles.rewardText, { opacity: fadeAnim }]}
            >
              {animatedTexts[textIndex]}
            </Animated.Text>
          </View>

          <TouchableOpacity onPress={collapseBanner}>
            <Ionicons name="close-circle" size={22} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <TouchableOpacity style={styles.rewardChip} onPress={expandBanner}>
          <Ionicons
            name="gift-outline"
            size={18}
            color="#fff"
            style={{ marginRight: 6 }}
          />
          <Animated.Text
            style={{ color: "#fff", fontWeight: "600", opacity: fadeAnim }}
          >
            {animatedTexts[textIndex]}
          </Animated.Text>
        </TouchableOpacity>
      )}

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <Ionicons
          name="search"
          size={20}
          color="#999"
          style={{ marginRight: 10 }}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 160 }}
        />
      )}

      {selectedProductIds.length > 0 && (
        <View style={styles.checkoutWrapper}>
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={startCheckout}
          >
            <Ionicons
              name="cart-outline"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.checkoutText}>Proceed to Checkout</Text>
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

      {/* Notes Popup */}
      <Modal visible={popupVisible} transparent animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popupBox}>
            {currentProduct && (
              <>
                <Text style={styles.popupTitle}>{currentProduct.name}</Text>
                <Text style={styles.popupPrice}>£{currentProduct.price}</Text>

                <View style={styles.notesLabelRow}>
                  <Ionicons
                    name="document-text-outline"
                    size={18}
                    color="#666"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.notesLabel}>
                    Add special instructions (optional)
                  </Text>
                </View>

                <TextInput
                  style={styles.popupInput}
                  placeholder="E.g. Less spicy, no onions, extra sauce..."
                  value={noteInput}
                  onChangeText={setNoteInput}
                  multiline
                />

                <View style={styles.popupNavRow}>
                  {popupIndex > 0 && (
                    <TouchableOpacity
                      style={styles.popupNavButton}
                      onPress={handleBackPopup}
                    >
                      <Text style={styles.popupNavText}>Back</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.popupNavButton}
                    onPress={handleNextPopup}
                  >
                    <Text style={styles.popupNavText}>
                      {popupIndex === selectedProductIds.length - 1
                        ? "Finish"
                        : "Next"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },

  rewardBanner: {
    width: "100%",
    backgroundColor: "#35a650ff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    overflow: "hidden",
    borderRadius: 5,
  },

  rewardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 10,
  },

  rewardText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  rewardChip: {
    backgroundColor: "#2ad552ff",
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignSelf: "center",
    borderRadius: 5,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  searchWrapper: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 50,
  },

  searchInput: { flex: 1, fontSize: 16 },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 5,
    padding: 12,
    elevation: 3,
  },

  image: {
    width: 115,
    height: 115,
    borderRadius: 5,
  },

  infoContainer: { flex: 1, marginLeft: 12 },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  name: { fontSize: 17, fontWeight: "700" },

  desc: { fontSize: 14, color: "#666", marginTop: 4 },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  price: { fontSize: 17, fontWeight: "700", color: "#28a745" },

  counterContainer: { justifyContent: "center" },
  counterRow: { flexDirection: "row", alignItems: "center" },

  counterButton: {
    backgroundColor: "#e0e0e0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
  },

  counterText: { fontSize: 18, fontWeight: "700" },

  quantity: { marginHorizontal: 10, fontSize: 16, fontWeight: "700" },

  addButton: {
    backgroundColor: "#28a745",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },

  addButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  checkoutWrapper: {
    position: "absolute",
    bottom: 95,
    width: "100%",
    paddingHorizontal: 20,
  },

  checkoutButton: {
    backgroundColor: "#28a745",
    paddingVertical: 14,
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  checkoutText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  popupOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  popupBox: {
    width: "80%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 5,
  },

  popupTitle: { fontSize: 20, fontWeight: "700" },
  popupPrice: { fontSize: 18, color: "#28a745", marginBottom: 12 },

  notesLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  notesLabel: {
    fontSize: 14,
    color: "#555",
  },

  popupInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    minHeight: 60,
    textAlignVertical: "top",
  },

  popupNavRow: { flexDirection: "row", justifyContent: "space-between" },

  popupNavButton: {
    backgroundColor: "#28a745",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },

  popupNavText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
