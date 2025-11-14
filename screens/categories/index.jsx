import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppHeader from "../AppHeader";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 40) / 2; // two items per row with spacing

export default function Categories({ navigation }) {
  const [user, setUser] = useState(null);
  const [searchText, setSearchText] = useState("");

  // Dummy categories for now
  const categories = [
  { id: "1", name: "Veg Restaurant", image: require("../../assets/restaurant.png") },
  { id: "2", name: "Veg Restaurant", image: require("../../assets/restaurant.png") },
  { id: "3", name: "Veg Restaurant", image: require("../../assets/restaurant.png") },
  { id: "4", name: "Veg Restaurant", image: require("../../assets/restaurant.png") },
];


  // Load user for header
  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    };
    loadUser();
  }, []);

  const renderCategory = ({ item }) => (
    <TouchableOpacity style={styles.categoryCard}>
      <Image source={item.image} style={styles.categoryImage} />
      <Text style={styles.categoryText}>{item.name}</Text>
    </TouchableOpacity>
  );

  // Filter categories based on search
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Reusable Header */}
      <AppHeader user={user} navigation={navigation} onMenuPress={() => {}} />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search categories..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Categories Grid */}
      <FlatList
        data={filteredCategories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  searchContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchInput: {
    height: 45,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  grid: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  categoryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    margin: 10,
    width: ITEM_WIDTH,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
    padding: 10,
  },
  categoryImage: {
    width: ITEM_WIDTH - 20,
    height: ITEM_WIDTH - 20,
    borderRadius: 10,
    resizeMode: "cover",
  },
  categoryText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
});
