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
  ScrollView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchProducts } from "../../services/productService";
import AppHeader from "../AppHeader";
import Ionicons from "react-native-vector-icons/Ionicons";
import BottomBar from "../BottomBar";

const { width } = Dimensions.get("window");

export default function Products({ route, navigation }) {
  const { userId, categoryId } = route.params;

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState({}); // key: productId, value: quantity

  // Popup states
  const [popupVisible, setPopupVisible] = useState(false);
  const [orderSummaryVisible, setOrderSummaryVisible] = useState(false);
  const [checkoutDetailsVisible, setCheckoutDetailsVisible] = useState(false);
  const [cartIndex, setCartIndex] = useState(0);
  const [notes, setNotes] = useState({});
  const [collectionType, setCollectionType] = useState(null); // default
  const [kerbsidePopupVisible, setKerbsidePopupVisible] = useState(false);

  // Kerbside form
  const [carColor, setCarColor] = useState("");
  const [carRegNumber, setCarRegNumber] = useState("");
  const [carOwner, setCarOwner] = useState("");

  // Checkout notes
  const [allergyNotes, setAllergyNotes] = useState("");

  useEffect(() => {
    loadUser();
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts(searchText);
  }, [searchText]);

  const loadUser = async () => {
    const storedUser = await AsyncStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  };

  const loadProducts = async () => {
    try {
      const data = await fetchProducts(userId, categoryId);
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.log("Product Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = (text) => {
    setSearchText(text);
    if (!text.trim()) {
      setFilteredProducts(products);
      return;
    }
    const query = text.toLowerCase();
    const filtered = products.filter((item) =>
      item.name.toLowerCase().includes(query)
    );
    setFilteredProducts(filtered);
  };

  const increment = (id) => {
    setCartItems((prev) => ({
      ...prev,
      [id]: prev[id] ? prev[id] + 1 : 1,
    }));
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

  const openCartPopup = () => {
    if (Object.keys(cartItems).length === 0) return;
    setCartIndex(0);
    setPopupVisible(true);
  };

  const currentProductId = Object.keys(cartItems)[cartIndex];
  const currentProduct = products.find(p => p.id == currentProductId);
  const currentQty = cartItems[currentProductId] || 1;

  const incrementPopupQty = () => {
    setCartItems((prev) => ({
      ...prev,
      [currentProductId]: prev[currentProductId] + 1,
    }));
  };
  const decrementPopupQty = () => {
    setCartItems((prev) => {
      const newQty = prev[currentProductId] - 1;
      const updated = { ...prev };
      if (newQty <= 0) delete updated[currentProductId];
      else updated[currentProductId] = newQty;
      return updated;
    });
  };

  const addNotesForCurrentProduct = (text) => {
    setNotes(prev => ({ ...prev, [currentProductId]: text }));
  };

  const proceedNextProduct = () => {
    const nextIndex = cartIndex + 1;
    if (nextIndex < Object.keys(cartItems).length) {
      setCartIndex(nextIndex);
    } else {
      setPopupVisible(false);
      setOrderSummaryVisible(true);
    }
  };

  const goBackProductPopup = () => {
    if (cartIndex > 0) {
      setCartIndex(cartIndex - 1);
    } else {
      setPopupVisible(false);
    }
  };

  const removeFromCart = (id) => {
    setCartItems(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    setNotes(prev => {
      const updatedNotes = { ...prev };
      delete updatedNotes[id];
      return updatedNotes;
    });
  };

  const handleKerbsideContinue = () => {
    if (!carColor.trim() || !carRegNumber.trim() || !carOwner.trim()) {
      Alert.alert("Error", "All fields are mandatory");
      return;
    }
    setKerbsidePopupVisible(false);
    setCollectionType("kerbside");
    setOrderSummaryVisible(true);
  };

  const backFromKerbsidePopup = () => {
    setKerbsidePopupVisible(false);
    setOrderSummaryVisible(true);
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
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
          <View style={styles.priceRow}>
            {item.discount_price ? (
              <>
                <Text style={styles.beforePrice}>£{item.price}</Text>
                <Text style={styles.discountPrice}>£{item.discount_price}</Text>
              </>
            ) : (
              <Text style={styles.discountPrice}>£{item.price}</Text>
            )}
          </View>
        </View>
        <View style={styles.counterContainer}>
          {qty > 0 ? (
            <View style={styles.counterRow}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => decrement(item.id)}
              >
                <Text style={styles.counterText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantity}>{qty}</Text>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => increment(item.id)}
              >
                <Text style={styles.counterText}>+</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => increment(item.id)}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const totalAmount = () => {
    return Object.keys(cartItems).reduce((sum, id) => {
      const p = products.find(p => p.id == id);
      if (!p) return sum;
      const price = p.discount_price || p.price;
      return sum + price * cartItems[id];
    }, 0).toFixed(2);
  };

  return (
    <View style={styles.container}>
      <AppHeader user={user} navigation={navigation} />

      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={20} color="#999" style={{ marginRight: 10 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#888"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 140 }}
        />
      )}

      {Object.keys(cartItems).length > 0 && (
        <TouchableOpacity style={styles.addToCartWrapper} onPress={openCartPopup}>
          <View style={styles.addToCartContent}>
            <Ionicons name="cart-outline" size={22} color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.addToCartText}>
              {Object.values(cartItems).reduce((a, b) => a + b, 0)} items in Cart
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* PRODUCT POPUP */}
      <Modal transparent visible={popupVisible} animationType="fade">
        <View style={styles.popupOverlay}>
          {currentProduct && (
            <View style={styles.popupContainer}>
              <TouchableOpacity style={styles.backButton} onPress={goBackProductPopup}>
                <Ionicons name="arrow-back" size={22} color="#333" />
              </TouchableOpacity>
              <Text style={styles.popupTitle}>{currentProduct.name}</Text>
              <Text style={styles.popupPrice}>
                Price: £{((currentProduct.discount_price || currentProduct.price) * currentQty).toFixed(2)}
              </Text>

              <Text style={styles.notesHeading}>Notes</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Add notes..."
                placeholderTextColor="#888"
                value={notes[currentProductId] || ""}
                onChangeText={addNotesForCurrentProduct}
                multiline
              />

              <View style={styles.popupBottomRow}>
                <View style={styles.counterRow}>
                  <TouchableOpacity style={styles.counterButton} onPress={decrementPopupQty}>
                    <Text style={styles.counterText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantity}>{currentQty}</Text>
                  <TouchableOpacity style={styles.counterButton} onPress={incrementPopupQty}>
                    <Text style={styles.counterText}>+</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.popupAddButton} onPress={proceedNextProduct}>
                  <Text style={styles.popupAddButtonText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* ORDER SUMMARY */}
      <Modal transparent visible={orderSummaryVisible} animationType="fade">
        <View style={styles.popupOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center" }}>
            <View style={styles.orderPopupContainer}>
              <TouchableOpacity style={styles.backButton} onPress={() => setOrderSummaryVisible(false)}>
                <Ionicons name="arrow-back" size={22} color="#333" />
              </TouchableOpacity>
              {Object.keys(cartItems).map((id) => {
                const p = products.find(pr => pr.id == id);
                if (!p) return null;
                const qty = cartItems[id];
                return (
                  <View key={id} style={{ marginBottom: 12 }}>
                    <View style={styles.orderTopRow}>
                      <Text style={styles.popupTitle}>{p.name}</Text>
                      <View style={styles.orderAmountRow}>
                        <Text style={styles.popupPrice}>
                          £{((p.discount_price || p.price) * qty).toFixed(2)}
                        </Text>
                        <TouchableOpacity onPress={() => removeFromCart(id)} style={styles.removeButton}>
                          <Text style={styles.removeText}>-</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    {notes[id] && <Text style={{ marginTop: 4, color: "#555" }}>Notes: {notes[id]}</Text>}
                  </View>
                );
              })}

              <Text style={styles.confirmationText}>Actual time will be confirmed by the business</Text>
              <Text style={styles.collectionText}>Collection (20min)</Text>
              <Text style={styles.collectionHeading}>Select Collection Type *</Text>
              <View style={styles.collectionButtons}>
                <TouchableOpacity
                  style={[styles.collectionButton, collectionType === "kerbside" && styles.selectedButton]}
                  onPress={() => {
                    setCollectionType("kerbside");
                    setKerbsidePopupVisible(true); // open kerbside popup if selected
                  }}
                >
                  <Text style={[styles.collectionButtonText, collectionType === "kerbside" && { color: "#fff" }]}>
                    Kerbside
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.collectionButton, collectionType === "instore" && styles.selectedButton]}
                  onPress={() => setCollectionType("instore")}
                >
                  <Text style={[styles.collectionButtonText, collectionType === "instore" && { color: "#fff" }]}>
                    In Store
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.checkoutButton,
                  !collectionType && { backgroundColor: "#ccc" }, // grey if not selected
                ]}
                onPress={() => {
                  if (!collectionType) {
                    Alert.alert("Error", "Please select collection type before checkout");
                    return;
                  }

                  if (collectionType === "kerbside") {
                    if (!carColor.trim() || !carRegNumber.trim() || !carOwner.trim()) {
                      Alert.alert("Error", "Please fill all Kerbside details before checkout");
                      return;
                    }
                  }

                  setOrderSummaryVisible(false);
                  setCheckoutDetailsVisible(true);
                }}
                disabled={!collectionType} // disable until selection
              >
                <Text style={styles.checkoutButtonText}>Checkout</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* CHECKOUT DETAILS MODAL */}
      <Modal transparent visible={checkoutDetailsVisible} animationType="fade">
        <View style={styles.popupOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center" }}>
            <View style={styles.orderPopupContainer}>
              <Text style={styles.popupTitle}>Do you have any allergy or dietary requirements?</Text>
              <Text style={{ marginTop: 10, fontSize: 14, color: "#555" }}>
                Please specify any allergies or dietary restrictions to help us prepare your order safely.
              </Text>
              <TextInput
                style={[styles.notesInput, { height: 80 }]}
                placeholder="Please leave your note..."
                placeholderTextColor="#888"
                value={allergyNotes}
                onChangeText={setAllergyNotes}
                multiline
              />
              <TouchableOpacity
                style={styles.popupAddButton}
                onPress={() => {
                  setCheckoutDetailsVisible(false);
                  navigation.navigate("CartSummary", {
                  cartItems,
                  notes,
                  collectionType,
                  kerbsideDetails: { carColor, carRegNumber, carOwner },
                  allergyNotes,
                  products,
                });
                }}
              >
                <Text style={styles.popupAddButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* KERBSIDE DETAILS POPUP */}
      <Modal transparent visible={kerbsidePopupVisible} animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popupContainer}>
            <TouchableOpacity style={styles.backButton} onPress={backFromKerbsidePopup}>
              <Ionicons name="arrow-back" size={22} color="#333" />
            </TouchableOpacity>
            <Text style={styles.popupTitle}>Enter Car Details</Text>

            <TextInput
              style={styles.notesInput}
              placeholder="Car Color"
              value={carColor}
              onChangeText={setCarColor}
            />
            <TextInput
              style={styles.notesInput}
              placeholder="Registration Number"
              value={carRegNumber}
              onChangeText={setCarRegNumber}
            />
            <TextInput
              style={styles.notesInput}
              placeholder="Owner Name"
              value={carOwner}
              onChangeText={setCarOwner}
            />

            <TouchableOpacity
              style={styles.popupAddButton}
              onPress={handleKerbsideContinue}
            >
              <Text style={styles.popupAddButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomBar navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  searchWrapper: { marginTop: 12, marginHorizontal: 16, backgroundColor: "#fff", borderRadius: 15, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, elevation: 4, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, height: 50 },
  searchInput: { flex: 1, fontSize: 16, color: "#333" },
  card: { flexDirection: "row", backgroundColor: "#fff", marginHorizontal: 16, marginVertical: 8, borderRadius: 16, padding: 12, elevation: 3, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, alignItems: "center" },
  image: { width: 100, height: 100, borderRadius: 12, resizeMode: "cover" },
  infoContainer: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: "700", color: "#222" },
  desc: { fontSize: 13, color: "#666", marginTop: 4 },
  priceRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  beforePrice: { fontSize: 14, color: "#999", textDecorationLine: "line-through", marginRight: 6 },
  discountPrice: { fontSize: 16, fontWeight: "700", color: "#28a745" },
  counterContainer: { marginLeft: 12 },
  counterRow: { flexDirection: "row", alignItems: "center" },
  counterButton: { backgroundColor: "#e0e0e0", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  counterText: { fontSize: 18, fontWeight: "700", color: "#333" },
  quantity: { marginHorizontal: 10, fontSize: 16, fontWeight: "600", color: "#333" },
  addButton: { backgroundColor: "#28a745", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  addButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  addToCartWrapper: { position: "absolute", bottom: 80, left: 16, right: 16, backgroundColor: "#ff6f00", paddingVertical: 16, borderRadius: 14, alignItems: "center", justifyContent: "center", elevation: 6, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  addToCartText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  addToCartContent: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  collectionHeading: { fontSize: 16, fontWeight: "700", marginBottom: 8, color: "#222" },

  popupOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  popupContainer: { width: width - 40, backgroundColor: "#fff", borderRadius: 16, padding: 20 },
  popupTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  popupPrice: { fontSize: 18, fontWeight: "700", color: "#28a745", marginBottom: 12, textAlign: "center" },
  notesHeading: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
  notesInput: { borderWidth: 1, borderColor: "#ccc", borderRadius: 12, padding: 10, height: 50, marginBottom: 12 },
  popupBottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  popupAddButton: { backgroundColor: "#28a745", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, marginTop: 10, alignItems: "center" },
  popupAddButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  backButton: { position: "absolute", left: 12, top: 12, zIndex: 10 },
  orderPopupContainer: { width: width - 32, backgroundColor: "#fff", borderRadius: 16, padding: 20 },
  orderTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderAmountRow: { flexDirection: "row", alignItems: "center" },
  removeText: { fontSize: 22, fontWeight: "700", color: "#ff4d4d", marginLeft: 12 },
  removeButton: { marginLeft: 10 },
  confirmationText: { marginTop: 10, fontSize: 14, color: "#555" },
  collectionText: { marginTop: 8, fontSize: 16, fontWeight: "600", color: "#222" },
  collectionButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  collectionButton: { flex: 0.48, borderWidth: 1, borderColor: "#28a745", borderRadius: 12, paddingVertical: 10, alignItems: "center" },
  selectedButton: { backgroundColor: "#28a745" },
  collectionButtonText: { color: "#28a745", fontWeight: "600" },
  totalAmount: { marginTop: 12, fontSize: 18, fontWeight: "700", textAlign: "center" },
  checkoutButton: { backgroundColor: "#ff6f00", marginTop: 16, paddingVertical: 14, borderRadius: 14, alignItems: "center", width: width - 100, alignSelf: "center" },
  checkoutButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
