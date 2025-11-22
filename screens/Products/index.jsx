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
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.desc} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.priceRow}>
            {item.discount_price ? (
              <>
                <Text style={styles.discountPrice}>£{item.price}</Text>
                <Text style={styles.beforePrice}>£{item.discount_price}</Text>
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

  const handleAddToCart = () => {
    const cartData = Object.keys(cartItems).map((id) => ({
      productId: id,
      quantity: cartItems[id],
    }));
    console.log("Add to Cart:", cartData);
    // Navigate to cart or show toast
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
        <TouchableOpacity style={styles.addToCartWrapper} onPress={handleAddToCart}>
          <View style={styles.addToCartContent}>
            <Ionicons name="cart-outline" size={22} color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.addToCartText}>
              {Object.values(cartItems).reduce((a, b) => a + b, 0) > 0
                ? `Add ${Object.values(cartItems).reduce((a, b) => a + b, 0)} items to Cart`
                : 'Cart is empty'}
            </Text>
          </View>
        </TouchableOpacity>

      )}

      <BottomBar navigation={navigation} />
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
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    height: 50,
  },
  searchInput: { flex: 1, fontSize: 16, color: "#333" },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    alignItems: "center",
  },
  image: { width: 100, height: 100, borderRadius: 12, resizeMode: "cover" },
  infoContainer: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: "700", color: "#222" },
  desc: { fontSize: 13, color: "#666", marginTop: 4 },
  priceRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  beforePrice: { fontSize: 14, color: "#999", textDecorationLine: "line-through", marginLeft: 6 },
  discountPrice: { fontSize: 16, fontWeight: "700", color: "#28a745" },

  counterContainer: { marginLeft: 12 },
  counterRow: { flexDirection: "row", alignItems: "center" },
  counterButton: {
    backgroundColor: "#e0e0e0",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  counterText: { fontSize: 18, fontWeight: "700", color: "#333" },
  quantity: { marginHorizontal: 10, fontSize: 16, fontWeight: "600", color: "#333" },
  addButton: {
    backgroundColor: "#28a745",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  addToCartWrapper: {
    position: "absolute",
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: "#ff6f00",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  addToCartText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  addToCartContent: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
});
