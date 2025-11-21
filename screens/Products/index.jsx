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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchProducts } from "../../services/productService";
import AppHeader from "../AppHeader";
import Ionicons from "react-native-vector-icons/Ionicons";
import BottomBar from "../BottomBar";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 40) / 2;

export default function Products({ route, navigation }) {
  const { userId, categoryId } = route.params;

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={
          item.image ? { uri: item.image } : require("../../assets/restaurant.png")
        }
        style={styles.image}
      />

      <Text style={styles.name} numberOfLines={1}>
        {item.name}
      </Text>

      <Text style={styles.desc} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.priceRow}>
        {item.discount_price ? (
          <>
            <Text style={styles.beforePrice}>₹{item.price}</Text>
            <Text style={styles.discountPrice}>₹{item.discount_price}</Text>
          </>
        ) : (
          <Text style={styles.normalPrice}>₹{item.price}</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <AppHeader user={user} navigation={navigation} />
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />

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
          numColumns={2}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 50 }}
        />
      )}
      <BottomBar navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },

  searchWrapper: {
    marginTop: 10,
    marginHorizontal: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    height: 50,
  },

  searchIcon: {
    marginRight: 8,
    opacity: 0.6,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },

  card: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    margin: 10,
    borderRadius: 14,
    padding: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },

  image: {
    width: "100%",
    height: 130,
    borderRadius: 12,
    resizeMode: "cover",
  },

  name: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },

  desc: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  beforePrice: {
    fontSize: 14,
    color: "#999",
    textDecorationLine: "line-through",
    marginRight: 6,
  },

  discountPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "green",
  },

  normalPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
});
