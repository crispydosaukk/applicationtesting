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
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useIsFocused } from "@react-navigation/native";
import { RefreshControl } from "react-native";
import useRefresh from "../hooks/useRefresh";

import AppHeader from "./AppHeader";
import BottomBar from "./BottomBar";
import MenuModal from "./MenuModal";
import RestaurantImg from "../assets/restaurant.png";
import AllergyAlert from "../assets/allergy-alert.jpg";
import Rating5 from "../assets/rating-5.png";

import { fetchRestaurants } from "../services/restaurantService";
import { getCart } from "../services/cartService";

const { width } = Dimensions.get("window");
const scale = width / 400;
const FONT_FAMILY = Platform.select({ ios: "System", android: "System" });

function RestaurantCard({ name, address, photo, onPress, instore, kerbside }) {
  return (
    <TouchableOpacity
      style={cardStyles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Image
        source={photo ? { uri: photo } : RestaurantImg}
        style={cardStyles.image}
      />
      <View style={cardStyles.info}>
        <Text style={cardStyles.name} numberOfLines={1}>
          {name}
        </Text>

        <View style={cardStyles.vegBadge}>
          <Ionicons name="leaf-outline" size={14 * scale} color="#16a34a" />
          <Text style={cardStyles.vegText}>Pure Veg</Text>
        </View>

        <Text style={cardStyles.address} numberOfLines={2}>
          {address}
        </Text>

        <View style={cardStyles.serviceRow}>
          {instore && (
            <View style={cardStyles.serviceChip}>
              <Ionicons name="storefront-outline" size={14 * scale} color="#555" />
              <Text style={cardStyles.serviceChipText}>In-store</Text>
            </View>
          )}

          {kerbside && (
            <View style={cardStyles.serviceChip}>
              <Ionicons name="car-outline" size={14 * scale} color="#555" />
              <Text style={cardStyles.serviceChipText}>Kerbside</Text>
            </View>
          )}
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

  // Load User
  useEffect(() => {
    const loadUser = async () => {
      const stored = await AsyncStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
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

  // Fetch Cart
  useEffect(() => {
    const fetchCart = async () => {
      if (!user) return;
      const customerId = user.id ?? user.customer_id;
      if (!customerId) return;

      try {
        const res = await getCart(customerId);
        if (res?.status === 1 && Array.isArray(res.data)) {
          const map = {};
          res.data.forEach((item) => {
            const qty = item.product_quantity ?? 0;
            if (qty > 0) {
              map[item.product_id] =
                (map[item.product_id] || 0) + qty;
            }
          });
          setCartItems(map);
        }
      } catch (err) {
        console.log("Cart error:", err);
      }
    };

    if (isFocused) fetchCart();
  }, [isFocused, user]);

  // Slider Auto Move
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


  const { refreshing, onRefresh } = useRefresh(async () => {
    // reload restaurants
    const list = await fetchRestaurants();
    setRestaurants(list);

    // reload user cart
    if (user) {
      const customerId = user.id ?? user.customer_id;
      const res = await getCart(customerId);

      if (res?.status === 1 && Array.isArray(res.data)) {
        const map = {};
        res.data.forEach((item) => {
          const qty = item.product_quantity ?? 0;
          if (qty > 0) {
            map[item.product_id] = (map[item.product_id] || 0) + qty;
          }
        });
        setCartItems(map);
      }
    }
  });


  return (
    <View style={styles.root}>
      {/* header (handles top inset itself, like CartSummary) */}
      <AppHeader
        user={user}
        navigation={navigation}
        cartItems={cartItems}
        onMenuPress={() => setMenuVisible(true)}
      />

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <Ionicons
            name="search"
            size={18 * scale}
            color="#666"
            style={{ marginRight: 8 * scale }}
          />
          <TextInput
            placeholder="Search restaurants..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

        {/* Slider */}
        <View style={{ marginTop: 8 }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            ref={scrollRef}
            onScroll={(e) =>
              setActiveIndex(
                Math.round(e.nativeEvent.contentOffset.x / width)
              )
            }
            scrollEventThrottle={16}
          >
            {sliderImages.map((img, i) => (
              <View key={i} style={{ width }}>
                <Image source={img} style={styles.sliderImage} />
              </View>
            ))}
          </ScrollView>

          {/* dots */}
          <View style={styles.dotContainer}>
            {sliderImages.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    width: activeIndex === i ? 20 : 7,
                    opacity: activeIndex === i ? 1 : 0.35,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Info Banners */}
        <View style={styles.infoBannerRow}>
          <Image source={AllergyAlert} style={styles.infoBannerImg} />
          <Image source={Rating5} style={styles.infoBannerImg} />
        </View>

        {/* Restaurant List */}
        <View style={{ marginTop: 8 }}>
          {filteredRestaurants.map((r, i) => (
            <RestaurantCard
              key={i}
              name={r.name}
              address={r.address}
              photo={r.photo}
              instore={r.instore}
              kerbside={r.kerbside}
              onPress={() =>
                navigation.navigate("Categories", { userId: r.userId })
              }
            />
          ))}
        </View>
      </ScrollView>

      <MenuModal
        visible={menuVisible}
        setVisible={setMenuVisible}
        user={user}
        navigation={navigation}
      />
      <BottomBar navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  searchWrapper: {
    paddingHorizontal: 10,
    paddingVertical: 4, // less vertical padding
    backgroundColor: "#f5f5f5",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e3e3e3",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14 * scale,
    color: "#222",
    fontFamily: FONT_FAMILY,
  },

  sliderImage: {
    width: width * 0.92,
    height: 150 * scale,
    alignSelf: "center",
    borderRadius: 5,
    resizeMode: "cover",
  },
  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 6,
  },
  dot: {
    height: 7,
    borderRadius: 5,
    backgroundColor: "#444",
    marginHorizontal: 4,
  },

  infoBannerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 15,
    marginTop: 12,
  },
  infoBannerImg: {
    width: (width - 40) / 2,
    height: 100 * scale,
    borderRadius: 8,
    resizeMode: "contain",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
});

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    marginHorizontal: 15,
    marginVertical: 6,
    padding: 12,
    borderRadius: 8,
    elevation: 2,
  },
  image: {
    width: width * 0.22,
    height: width * 0.22,
    borderRadius: 6,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 15 * scale,
    fontWeight: "700",
    color: "#222",
    fontFamily: FONT_FAMILY,
  },
  vegBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    backgroundColor: "#e8f8ee",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  vegText: {
    marginLeft: 5,
    color: "#16a34a",
    fontSize: 12 * scale,
    fontWeight: "700",
    fontFamily: FONT_FAMILY,
  },
  address: {
    fontSize: 13 * scale,
    color: "#555",
    marginTop: 6,
    lineHeight: 18,
    fontFamily: FONT_FAMILY,
  },
  serviceRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  serviceChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f3f3",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginRight: 10,
  },
  serviceChipText: {
    marginLeft: 5,
    fontSize: 12 * scale,
    color: "#333",
    fontFamily: FONT_FAMILY,
  },
});
