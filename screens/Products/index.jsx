import React, { useEffect, useState } from "react";
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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchProducts } from "../../services/productService";
import { addToCart } from "../../services/cartService";
import AppHeader from "../AppHeader";
import BottomBar from "../BottomBar";
import Ionicons from "react-native-vector-icons/Ionicons";

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

        // Initialize cartItems if already in cart (from local storage)
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
  }, []);

  // Filter products by search text
  useEffect(() => {
    if (!searchText.trim()) setFilteredProducts(products);
    else {
      const filtered = products.filter((item) =>
        item.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchText, products]);

  // Increment quantity
  const increment = (id) => {
    setCartItems((prev) => {
      const newQty = prev[id] ? prev[id] + 1 : 1;
      return { ...prev, [id]: newQty };
    });
  };

  // Decrement quantity
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

  // Start checkout popup
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

  // Handle Next in popup
  const handleNextPopup = async () => {
    const selectedIds = Object.keys(cartItems);
    const currentProductId = selectedIds[popupIndex];

    // Save current note
    setNotes((prev) => ({
      ...prev,
      [currentProductId]: noteInput,
    }));

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
      // All done, go to CartSummary
      setPopupVisible(false);
      navigation.navigate("CartSummary", {
        cartItems,
        notes,
        user,
      });
    }
  };

  // Handle Back in popup
  const handleBackPopup = () => {
    const selectedIds = Object.keys(cartItems);
    if (popupIndex === 0) return;
    const prevIndex = popupIndex - 1;
    setPopupIndex(prevIndex);
    const prevProductId = selectedIds[prevIndex];
    setNoteInput(notes[prevProductId] || "");
  };

  // Render each product
  const renderItem = ({ item }) => {
    const qty = cartItems[item.id] || 0;
    return (
      <View style={styles.card}>
        <Image
          source={item.image ? { uri: item.image } : require("../../assets/restaurant.png")}
          style={styles.image}
        />
        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
          <Text style={styles.price}>£{item.price}</Text>
        </View>
        <View style={styles.counterContainer}>
          {qty > 0 ? (
            <View style={styles.counterRow}>
              <TouchableOpacity style={styles.counterButton} onPress={() => decrement(item.id)}>
                <Text style={styles.counterText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantity}>{qty}</Text>
              <TouchableOpacity style={styles.counterButton} onPress={() => increment(item.id)}>
                <Text style={styles.counterText}>+</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addButton} onPress={() => increment(item.id)}>
              <Text style={styles.addButtonText}>+</Text>
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
      <AppHeader user={user} navigation={navigation} />

      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={20} color="#999" style={{ marginRight: 10 }} />
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
          <TouchableOpacity style={styles.checkoutButton} onPress={startCheckout}>
            <Text style={styles.checkoutText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
      )}

      <BottomBar navigation={navigation} />

      {/* Notes Popup */}
      <Modal visible={popupVisible} transparent animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popupBox}>
            {currentProduct && (
              <>
                <Text style={styles.popupTitle}>{currentProduct.name}</Text>
                <Text style={styles.popupPrice}>£{currentProduct.price}</Text>
                <TextInput
                  style={styles.popupInput}
                  placeholder="Add notes (optional)"
                  value={noteInput}
                  onChangeText={setNoteInput}
                />
                <View style={styles.popupNavRow}>
                  {popupIndex > 0 && (
                    <TouchableOpacity style={styles.popupNavButton} onPress={handleBackPopup}>
                      <Text style={styles.popupNavText}>Back</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.popupNavButton} onPress={handleNextPopup}>
                    <Text style={styles.popupNavText}>{popupIndex === selectedProductIds.length - 1 ? "Finish" : "Next"}</Text>
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

  searchWrapper: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 15,
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
    borderRadius: 16,
    padding: 12,
    elevation: 3,
  },

  image: { width: 100, height: 100, borderRadius: 12 },

  infoContainer: { flex: 1, marginLeft: 12 },

  name: { fontSize: 16, fontWeight: "700" },
  desc: { fontSize: 13, color: "#666", marginTop: 4 },
  price: { marginTop: 6, fontSize: 16, fontWeight: "700", color: "#28a745" },

  counterContainer: { justifyContent: "center" },
  counterRow: { flexDirection: "row", alignItems: "center" },

  counterButton: {
    backgroundColor: "#e0e0e0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  counterText: { fontSize: 18, fontWeight: "700" },

  quantity: { marginHorizontal: 10, fontSize: 16, fontWeight: "700" },

  addButton: {
    backgroundColor: "#28a745",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
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
    borderRadius: 14,
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
    borderRadius: 12,
  },
  popupTitle: { fontSize: 20, fontWeight: "700" },
  popupPrice: { fontSize: 18, color: "#28a745", marginBottom: 12 },

  popupInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },

  popupNavRow: { flexDirection: "row", justifyContent: "space-between" },
  popupNavButton: {
    backgroundColor: "#28a745",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  popupNavText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
