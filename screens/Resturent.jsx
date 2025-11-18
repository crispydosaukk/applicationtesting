import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Image,
  Dimensions,
  Pressable,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";
import { logoutUser } from "../utils/authHelpers";
import AppHeader from "./AppHeader";
import RestaurantImg from "../assets/restaurant.png"; 
import { fetchRestaurants } from "../services/restaurantService";

const { width } = Dimensions.get("window");

function RestaurantCard({ name, address, photo, onPress }) {
  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.8}>
      <Image
        source={photo ? { uri: photo } : RestaurantImg}
        style={cardStyles.image}
      />

      <View style={cardStyles.info}>
        <Text style={cardStyles.name} numberOfLines={1}>{name}</Text>

        <View style={cardStyles.vegBadge}>
          <Ionicons name="leaf-outline" size={16} color="#16a34a" />
          <Text style={cardStyles.vegText}>Pure Veg</Text>
        </View>

        <Text style={cardStyles.address} numberOfLines={2}>{address}</Text>

        <View style={cardStyles.serviceRow}>
          <View style={cardStyles.serviceChip}>
            <Ionicons name="storefront-outline" size={15} color="#555" />
            <Text style={cardStyles.serviceChipText}>In-store</Text>
          </View>

          <View style={cardStyles.serviceChip}>
            <Ionicons name="car-outline" size={15} color="#555" />
            <Text style={cardStyles.serviceChipText}>Kerbside</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function Resturent({ navigation }) {
  const [user, setUser] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [restaurants, setRestaurants] = useState([]);

  const scrollRef = useRef(null);

  const sliderImages = [
    require("../assets/loyalty.png"),
    require("../assets/referal.png"),
    require("../assets/welcome.png"),
  ];

  // Load stored user
  useEffect(() => {
    const loadUser = async () => {
      const stored = await AsyncStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    };
    loadUser();
  }, []);

  // Fetch restaurants
  useEffect(() => {
    const loadRestaurants = async () => {
      const data = await fetchRestaurants();
      setRestaurants(data);
    };
    loadRestaurants();
  }, []);

  // Auto slider
  useEffect(() => {
    const timer = setInterval(() => {
      let next = activeIndex + 1;
      if (next >= sliderImages.length) next = 0;

      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setActiveIndex(next);
    }, 3000);

    return () => clearInterval(timer);
  }, [activeIndex]);

  const filteredRestaurants = restaurants.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <AppHeader user={user} navigation={navigation} onMenuPress={() => setMenuVisible(true)} />

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#777" />
          <TextInput
            placeholder="Search restaurants..."
            placeholderTextColor="#aaa"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Slider */}
      <View style={{ marginTop: 10 }}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          ref={scrollRef}
          onScroll={e =>
            setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width))
          }
          scrollEventThrottle={16}
        >
          {sliderImages.map((img, i) => (
            <View key={i} style={{ width }}>
              <Image source={img} style={styles.sliderImage} />
            </View>
          ))}
        </ScrollView>

        {/* Slider dots */}
        <View style={styles.dotContainer}>
          {sliderImages.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { width: activeIndex === i ? 22 : 8, opacity: activeIndex === i ? 1 : 0.4 },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Restaurants List */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 10 }}>
        {filteredRestaurants.map((r, index) => (
          <RestaurantCard
            key={index}
            name={r.name}
            address={r.address}
            photo={r.photo}
            onPress={() => navigation.navigate("Categories", { userId: r.userId })}
          />
        ))}
      </ScrollView>

      {/* Menu Modal */}
      <Modal transparent visible={menuVisible} animationType="fade">
        <View style={{ flex: 1 }}>
          <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)} />

          <View style={styles.menuBox}>
            {user ? (
              <TouchableOpacity
                style={styles.menuBtn}
                onPress={() => {
                  setMenuVisible(false);
                  logoutUser(navigation);
                }}
              >
                <Text style={styles.menuText}>Logout</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.menuBtn}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.replace("Login");
                }}
              >
                <Text style={styles.menuText}>Sign In</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },

  searchWrapper: { paddingHorizontal: 15, marginTop: 12 },
  searchBox: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  searchInput: { marginLeft: 10, fontSize: 16, flex: 1, color: "#333" },

  sliderImage: {
    width: width - 20,
    height: 180,
    alignSelf: "center",
    borderRadius: 16,
    marginTop: 10,
    resizeMode: "cover",
  },

  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  dot: {
    height: 8,
    borderRadius: 5,
    backgroundColor: "#444",
    marginHorizontal: 4,
  },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },

  menuBox: {
    position: "absolute",
    top: 65,
    right: 15,
    width: 160,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 12,
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  menuBtn: { paddingVertical: 12, paddingHorizontal: 18 },
  menuText: { fontSize: 16, color: "#333", fontWeight: "600" },
});

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginVertical: 8,
    padding: 12,
    borderRadius: 14,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  image: {
    width: 90,
    height: 90,
    borderRadius: 10,
  },

  info: { flex: 1, marginLeft: 12 },

  name: { fontSize: 18, fontWeight: "700", color: "#222" },

  vegBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    backgroundColor: "#e7f7ed",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  vegText: { marginLeft: 5, color: "#16a34a", fontSize: 13, fontWeight: "600" },

  address: { fontSize: 14, color: "#555", marginTop: 6, lineHeight: 18 },

  serviceRow: { flexDirection: "row", marginTop: 10 },
  serviceChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f4f4f4",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  serviceChipText: { marginLeft: 6, fontSize: 13, color: "#333" },
});
