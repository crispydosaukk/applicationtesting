import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");

export default function Products({ route, navigation }) {
  const { categoryId } = route.params; // SAFE – navigation payload correct!

  const products = [
    { id: "1", name: "Masala Dosa", price: 80, image: require("../../assets/topDosa.png") },
    { id: "2", name: "Plain Dosa", price: 60, image: require("../../assets/topDosa.png") },
    { id: "3", name: "Onion Dosa", price: 90, image: require("../../assets/topDosa.png") },
    { id: "4", name: "Set Dosa", price: 70, image: require("../../assets/topDosa.png") },
    { id: "5", name: "Rava Dosa", price: 85, image: require("../../assets/topDosa.png") },
  ];

  const [cart, setCart] = useState({});

  const increaseQty = (id) => {
    setCart((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const decreaseQty = (id) => {
    setCart((prev) => ({
      ...prev,
      [id]: prev[id] > 1 ? prev[id] - 1 : 0,
    }));
  };

  const renderProduct = ({ item }) => {
    const qty = cart[item.id] || 0;

    return (
      <View style={styles.card}>
        <Image source={item.image} style={styles.productImage} />

        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>₹ {item.price}</Text>

        {qty === 0 ? (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => increaseQty(item.id)}
          >
            <Text style={styles.addText}>ADD</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.counterContainer}>
            <TouchableOpacity style={styles.counterBtn} onPress={() => decreaseQty(item.id)}>
              <Text style={styles.counterText}>-</Text>
            </TouchableOpacity>

            <Text style={styles.qtyText}>{qty}</Text>

            <TouchableOpacity style={styles.counterBtn} onPress={() => increaseQty(item.id)}>
              <Text style={styles.counterText}>+</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/topDosa.png")}
        style={styles.topImage}
      />

      <Text style={styles.title}>Popular Items</Text>

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  topImage: {
    width: width,
    height: 180,
    resizeMode: "cover",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 15,
    marginLeft: 15,
    color: "#222",
  },

  card: {
    backgroundColor: "#fff",
    elevation: 3,
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 15,
    marginTop: 12,
  },

  productImage: {
    width: "100%",
    height: 130,
    borderRadius: 12,
  },

  name: {
    marginTop: 10,
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
  },

  price: {
    fontSize: 16,
    color: "#555",
    marginTop: 4,
  },

  addBtn: {
    marginTop: 12,
    backgroundColor: "#ff6b00",
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },

  addText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  counterContainer: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ff6b00",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    height: 40,
  },

  counterBtn: { paddingHorizontal: 10 },

  counterText: { fontSize: 20, fontWeight: "700", color: "#ff6b00" },

  qtyText: { fontSize: 17, fontWeight: "600", color: "#333" },
});
