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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";
import { logoutUser } from "../utils/authHelpers";
import AppHeader from "./AppHeader";
import RestaurantImg from "../assets/restaurant.png"; // fallback
import { fetchRestaurants } from "../services/restaurantService";

const { width } = Dimensions.get("window");

function RestaurentCard({ name, address, photo, veg = true, services = ["In-store", "Kerbside"], onPress }) {
  return (
    <TouchableOpacity style={cardStyles.container} onPress={onPress}>
      <Image source={photo ? { uri: photo } : RestaurantImg} style={cardStyles.image} />
      <View style={cardStyles.infoBox}>
        <Text style={cardStyles.name}>{name}</Text>
        {veg && (
          <View style={cardStyles.vegBadge}>
            <Ionicons name="leaf-outline" size={16} color="#1b8d3b" />
            <Text style={cardStyles.vegText}>100% Pure Veg</Text>
          </View>
        )}
        <Text style={cardStyles.address}>{address}</Text>
        <View style={cardStyles.services}>
          {services.map((service, idx) => (
            <View key={idx} style={cardStyles.serviceItem}>
              <Ionicons
                name={service === "Kerbside" ? "car-outline" : "storefront-outline"}
                size={18}
                color="#333"
              />
              <Text style={cardStyles.serviceText}>{service}</Text>
            </View>
          ))}
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

  // Load User
  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    };
    loadUser();
  }, []);

  // Fetch Restaurants
  useEffect(() => {
    const loadRestaurants = async () => {
      const data = await fetchRestaurants();
      setRestaurants(data);
    };
    loadRestaurants();
  }, []);

  // Auto Slider
  useEffect(() => {
    const timer = setInterval(() => {
      let nextIndex = activeIndex + 1;
      if (nextIndex >= sliderImages.length) nextIndex = 0;

      scrollRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });

      setActiveIndex(nextIndex);
    }, 3000);

    return () => clearInterval(timer);
  }, [activeIndex]);

  const filteredRestaurants = restaurants.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <AppHeader user={user} navigation={navigation} onMenuPress={() => setMenuVisible(true)} />

      <View style={styles.underline} />

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={22} color="#666" />
        <TextInput
          placeholder="Search..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      <View style={{ marginTop: 20 }}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          ref={scrollRef}
          onScroll={e => setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          scrollEventThrottle={16}
        >
          {sliderImages.map((img, index) => (
            <View key={index} style={{ width: width }}>
              <Image source={img} style={styles.sliderImage} />
            </View>
          ))}
        </ScrollView>

        <View style={styles.dotsContainer}>
          {sliderImages.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { opacity: activeIndex === i ? 1 : 0.3, width: activeIndex === i ? 20 : 8 },
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView style={{ marginTop: 10 }}>
        {filteredRestaurants.map((r, idx) => (
          <RestaurentCard
            key={idx}
            name={r.name}
            address={r.address}
            photo={r.photo}
            onPress={() =>
              navigation.navigate("Categories", { userId: r.userId })
            }
          />
        ))}
      </ScrollView>


      <Modal transparent visible={menuVisible} animationType="fade">
        <View style={{ flex: 1 }}>
          <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)} />
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

// Main styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff", paddingHorizontal: 10, paddingTop: 10 },
  underline: { width: "100%", height: 1, backgroundColor: "#ddd", marginTop: 8, marginBottom: 14 },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#f2f2f2", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: "#333" },
  sliderImage: { width: width, height: 180, borderRadius: 10, resizeMode: "cover" },
  dotsContainer: { flexDirection: "row", justifyContent: "center", marginTop: 10 },
  dot: { height: 8, borderRadius: 5, backgroundColor: "#444", marginHorizontal: 5 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
  menuBox: { position: "absolute", top: 60, right: 10, width: 150, backgroundColor: "#fff", borderRadius: 12, paddingVertical: 10, elevation: 12 },
  menuBtn: { paddingVertical: 12, paddingHorizontal: 15 },
  menuText: { fontSize: 16, fontWeight: "600", color: "#333" },
});

// Card styles
const cardStyles = StyleSheet.create({
  container: { flexDirection: "row", marginVertical: 8, marginHorizontal: 10, padding: 12, borderRadius: 12, backgroundColor: "#fff", elevation: 3 },
  image: { width: 80, height: 80, borderRadius: 6, marginRight: 10 },
  infoBox: { flex: 1 },
  name: { fontSize: 18, fontWeight: "700", color: "#222" },
  vegBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#e8f8ed", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 5, alignSelf: "flex-start" },
  vegText: { fontSize: 13, color: "#1b8d3b", marginLeft: 5, fontWeight: "600" },
  address: { marginTop: 5, fontSize: 14, color: "#555" },
  services: { flexDirection: "row", marginTop: 10 },
  serviceItem: { flexDirection: "row", alignItems: "center", marginRight: 15, backgroundColor: "#f3f3f3", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  serviceText: { fontSize: 14, marginLeft: 5, color: "#333", fontWeight: "600" },
});
