// Resturent.js
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useIsFocused } from "@react-navigation/native";
import AppHeader from "./AppHeader";
import BottomBar from "./BottomBar";
import MenuModal from "./MenuModal";
import RestaurantImg from "../assets/restaurant.png";
import { fetchRestaurants } from "../services/restaurantService";
import { getCart } from "../services/cartService";
import AllergyAlert from "../assets/allergy-alert.jpg";
import Rating5 from "../assets/rating-5.png";

const { width } = Dimensions.get("window");

function RestaurantCard({ name, address, photo, onPress }) {
  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.8}>
      <Image
        source={photo ? { uri: photo } : RestaurantImg}
        style={cardStyles.image}
      />

      <View style={cardStyles.info}>
        <Text style={cardStyles.name} numberOfLines={1}>
          {name}
        </Text>

        <View style={cardStyles.vegBadge}>
          <Ionicons name="leaf-outline" size={18} color="#16a34a" />
          <Text style={cardStyles.vegText}>Pure Veg</Text>
        </View>

        <Text style={cardStyles.address} numberOfLines={2}>
          {address}
        </Text>

        <View style={cardStyles.serviceRow}>
          <View style={cardStyles.serviceChip}>
            <Ionicons name="storefront-outline" size={16} color="#555" />
            <Text style={cardStyles.serviceChipText}>In-store</Text>
          </View>

          <View style={cardStyles.serviceChip}>
            <Ionicons name="car-outline" size={16} color="#555" />
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
  const [cartItems, setCartItems] = useState({});

  const scrollRef = useRef(null);
  const isFocused = useIsFocused();

  const sliderImages = [
    require("../assets/loyalty.png"),
    require("../assets/referal.png"),
    require("../assets/welcome.png"),
  ];

  useEffect(() => {
    const loadUser = async () => {
      const stored = await AsyncStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    };
    loadUser();
  }, []);

  useEffect(() => {
    const loadRestaurants = async () => {
      const data = await fetchRestaurants();
      setRestaurants(data);
    };
    loadRestaurants();
  }, []);

  useEffect(() => {
    const fetchCart = async () => {
      if (!user) return;
      const customerId = user.id ?? user.customer_id;
      if (!customerId) return;

      try {
        const res = await getCart(customerId);
        if (res && res.status === 1 && Array.isArray(res.data)) {
          const map = {};
          res.data.forEach((item) => {
            const qty = item.product_quantity || 0;
            if (qty > 0) {
              map[item.product_id] = (map[item.product_id] || 0) + qty;
            }
          });
          setCartItems(map);
        }
      } catch (err) {
        console.log("Cart fetch error:", err);
      }
    };

    if (isFocused) {
      fetchCart();
    }
  }, [isFocused, user]);

  useEffect(() => {
    const timer = setInterval(() => {
      let next = activeIndex + 1;
      if (next >= sliderImages.length) next = 0;

      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setActiveIndex(next);
    }, 3000);

    return () => clearInterval(timer);
  }, [activeIndex]);

  const filteredRestaurants = restaurants.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <AppHeader
        user={user}
        navigation={navigation}
        onMenuPress={() => setMenuVisible(true)}
        cartItems={cartItems}
      />

      {/* Sticky Search */}
      <View style={styles.stickySearch}>
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

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Slider */}
        <View style={{ marginTop: 15 }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            ref={scrollRef}
            onScroll={(e) =>
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

          {/* Dots */}
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

        {/* Banner Images with border frame */}
        <View style={styles.infoBannerRow}>
          <Image source={AllergyAlert} style={styles.infoBannerImg} />
          <Image source={Rating5} style={styles.infoBannerImg} />
        </View>

        {/* Restaurant List */}
        <View style={{ marginTop: 10 }}>
          {filteredRestaurants.map((r, index) => (
            <RestaurantCard
              key={index}
              name={r.name}
              address={r.address}
              photo={r.photo}
              onPress={() =>
                navigation.navigate("Categories", { userId: r.userId })
              }
            />
          ))}
        </View>
      </ScrollView>

      <MenuModal visible={menuVisible} setVisible={setMenuVisible} user={user} navigation={navigation} />

      <BottomBar navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },

  stickySearch: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#fafafa",
    zIndex: 10,
  },

  infoBannerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 15,
    marginTop: 15,
  },

  infoBannerImg: {
    width: (width - 45) / 2,
    height: 110,
    borderRadius: 10,
    resizeMode: "cover",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#d4d4d4",
  },

  searchBox: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    elevation: 3,
  },
  searchInput: { marginLeft: 10, fontSize: 16, flex: 1, color: "#333" },

  sliderImage: {
    width: width - 20,
    height: 180,
    alignSelf: "center",
    borderRadius: 5,
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
});

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginVertical: 8,
    padding: 14,
    borderRadius: 6,
    elevation: 3,
  },

  image: { width: 110, height: 110, borderRadius: 5 },

  info: { flex: 1, marginLeft: 14 },

  name: { fontSize: 17, fontWeight: "800", color: "#222" },

  vegBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "#e7f7ed",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  vegText: { marginLeft: 5, color: "#16a34a", fontSize: 14, fontWeight: "700" },

  address: { fontSize: 16, color: "#555", marginTop: 8, lineHeight: 20 },

  serviceRow: { flexDirection: "row", marginTop: 12 },
  serviceChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginRight: 10,
  },
  serviceChipText: { marginLeft: 6, fontSize: 14, color: "#333" },
});
