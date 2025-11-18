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
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppHeader from "../AppHeader";
import { fetchCategories } from "../../services/categoryService";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 40) / 2;

export default function Categories({ route, navigation }) {
  const { userId } = route.params;

  const [user, setUser] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    };
    loadUser();
  }, []);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await fetchCategories(userId);
      setCategories(data);
    } catch (error) {
      console.log("Category Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderCategory = ({ item }) => (
    <TouchableOpacity style={styles.categoryCard}>
      <Image
        source={
          item.image
            ? { uri: item.image }
            : require("../../assets/restaurant.png")
        }
        style={styles.categoryImage}
      />
      <Text style={styles.categoryText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const filteredCategories = categories.filter((cat) =>
  (cat?.name || "")
    .toLowerCase()
    .includes(searchText.toLowerCase())
);


  return (
    <View style={styles.container}>
      <AppHeader user={user} navigation={navigation} />

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search categories..."
          placeholderTextColor="#888"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={filteredCategories}
          renderItem={renderCategory}
          numColumns={2}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.grid}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  searchContainer: { padding: 15 },
  searchInput: {
    height: 45,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  grid: { paddingBottom: 20, paddingHorizontal: 10 },
  categoryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    margin: 10,
    width: ITEM_WIDTH,
    alignItems: "center",
    elevation: 4,
    padding: 10,
  },
  categoryImage: {
    width: ITEM_WIDTH - 20,
    height: ITEM_WIDTH - 20,
    borderRadius: 10,
  },
  categoryText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "600",
  },
});
