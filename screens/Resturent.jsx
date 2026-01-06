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
  StatusBar,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
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
      activeOpacity={0.9}
    >
      <View style={cardStyles.cardBody}>
        <View style={cardStyles.imageContainer}>
          <Image
            source={photo ? { uri: photo } : RestaurantImg}
            style={cardStyles.image}
          />
        </View>

        <View style={cardStyles.info}>
          <View style={cardStyles.headerRow}>
            <Text style={cardStyles.name}>
              {name}
            </Text>
            <Ionicons name="chevron-forward" size={18 * scale} color="#CCC" />
          </View>

          <View style={cardStyles.vegBadge}>
            <Ionicons name="leaf" size={12 * scale} color="#16a34a" />
            <Text style={cardStyles.vegText}>Pure Veg</Text>
          </View>

          <View style={cardStyles.addressRow}>
            <Ionicons name="location-sharp" size={14 * scale} color="#E23744" style={{ marginTop: 2 }} />
            <Text style={cardStyles.address} numberOfLines={2}>
              {address}
            </Text>
          </View>

          <View style={cardStyles.serviceRow}>
            {instore && (
              <View style={cardStyles.serviceChip}>
                <Ionicons name="storefront" size={11 * scale} color="#666" />
                <Text style={cardStyles.serviceChipText}>In-store</Text>
              </View>
            )}

            {kerbside && (
              <View style={cardStyles.serviceChip}>
                <Ionicons name="car" size={12 * scale} color="#666" />
                <Text style={cardStyles.serviceChipText}>Kerbside</Text>
              </View>
            )}
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

  const scrollX = useRef(new Animated.Value(0)).current;

  const offers = [
    {
      title: "SIGNUP BONUS",
      subtitle: "EARN £0.25 COMPLETELY FREE",
      desc: "Register now and get instant credit in your wallet.",
      icon: "gift-outline",
      colors: ["#FF416C", "#FF4B2B"], // Red
      textColor: "#FFFFFF",
      badgeColor: "rgba(255,255,255,0.25)",
    },
    {
      title: "LOYALTY REWARDS",
      subtitle: "EARN £0.25 ON EVERY ORDER",
      desc: "Order your favorite food and get cashback every time.",
      icon: "ribbon-outline",
      colors: ["#1D976C", "#93F9B9"], // Green
      textColor: "#004D40", // Dark green for better visibility
      badgeColor: "rgba(0,77,64,0.15)",
    },
    {
      title: "REFER & EARN",
      subtitle: "EARN £0.25 PER FRIEND",
      desc: "Invite your friends and earn rewards when they join.",
      icon: "people-outline",
      colors: ["#F2994A", "#F2C94C"], // Gold
      textColor: "#5D4037", // Dark brown for contrast
      badgeColor: "rgba(93,64,55,0.15)",
    },
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
      if (next >= offers.length) next = 0;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setActiveIndex(next);
    }, 4000);

    return () => clearInterval(timer);
  }, [activeIndex]);

  const filteredRestaurants = restaurants.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const [voiceListening, setVoiceListening] = useState(false);

  const startVoiceSearch = () => {
    setVoiceListening(true);
    // Simulate voice recognition
    setTimeout(() => {
      setVoiceListening(false);
      // Pick a random keyword from list to show it works
      const keywords = ["Milton", "London", "Dosa", "Crispy"];
      const random = keywords[Math.floor(Math.random() * keywords.length)];
      setSearch(random);
    }, 2500);
  };

  const { refreshing, onRefresh } = useRefresh(async () => {
    const list = await fetchRestaurants();
    setRestaurants(list);

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
      <StatusBar
        backgroundColor={offers[activeIndex].colors[0]}
        barStyle={offers[activeIndex].textColor === "#FFFFFF" ? "light-content" : "dark-content"}
      />

      {/* Top Zomato-style Unified Section - Fully Dynamic Immersive Gradient */}
      <View style={styles.topSection}>
        {/* Dynamic Background Layers - Smooth cross-fade spread across the whole section */}
        <View style={StyleSheet.absoluteFill}>
          {offers.map((offer, i) => {
            const opacity = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [0, 1, 0],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={`bg-${i}`}
                style={[StyleSheet.absoluteFill, { opacity }]}
              >
                <LinearGradient
                  colors={offer.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            );
          })}
        </View>

        <AppHeader
          user={user}
          navigation={navigation}
          cartItems={cartItems}
          onMenuPress={() => setMenuVisible(true)}
          transparent
          statusColor={offers[activeIndex].colors[0]}
          textColor={offers[activeIndex].textColor}
          barStyle={offers[activeIndex].textColor === "#FFFFFF" ? "light-content" : "dark-content"}
        />

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchBox}>
            <View style={styles.searchLeft}>
              <Ionicons
                name="search"
                size={20 * scale}
                color="#E23744"
              />
              <TextInput
                placeholder="Search restaurants, cuisines..."
                placeholderTextColor="#999"
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
              />
            </View>
            <View style={styles.searchDivider} />
            <TouchableOpacity style={styles.micButton} onPress={startVoiceSearch}>
              <Ionicons name="mic-outline" size={22 * scale} color="#E23744" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Voice Listening Overlay */}
        {voiceListening && (
          <View style={styles.voiceOverlay}>
            <LinearGradient
              colors={["rgba(226,55,68,0.95)", "rgba(226,55,68,0.8)"]}
              style={styles.voiceOverlayInner}
            >
              <Ionicons name="mic" size={60 * scale} color="#FFF" />
              <Text style={styles.voiceText}>Listening...</Text>
              <Text style={styles.voiceSubtext}>Try saying "Milton Keynes" or "Crispy Dosa"</Text>
              <TouchableOpacity style={styles.voiceClose} onPress={() => setVoiceListening(false)}>
                <Ionicons name="close-circle" size={40 * scale} color="#FFF" />
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* Premium Offer Slider - Integrated for Unified Look */}
        <View style={styles.sliderContainer}>
          <Animated.ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            ref={scrollRef}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              {
                useNativeDriver: false,
                listener: (e) => {
                  setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width));
                }
              }
            )}
            scrollEventThrottle={16}
          >
            {offers.map((offer, i) => (
              <View key={i} style={styles.sliderPage}>
                <View style={[styles.offerCardWrapper, { backgroundColor: 'transparent' }]}>
                  <View style={styles.offerCardContent}>
                    <View style={styles.offerTextCol}>
                      <Text style={[styles.offerBadge, { backgroundColor: offer.badgeColor, color: offer.textColor }]}>
                        {offer.title}
                      </Text>
                      <Text style={[styles.offerMainTitle, { color: offer.textColor }]}>
                        {offer.subtitle}
                      </Text>
                      <Text style={[styles.offerDesc, { color: offer.textColor, opacity: 0.8 }]}>
                        {offer.desc}
                      </Text>
                    </View>
                    <View style={[styles.offerIconCircle, { borderColor: offer.textColor, backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                      <Ionicons name={offer.icon} size={40 * scale} color={offer.textColor} />
                    </View>
                  </View>
                  {/* Decorative Elements */}
                  <View style={[styles.decorCircle1, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
                  <View style={[styles.decorCircle2, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />
                </View>
              </View>
            ))}
          </Animated.ScrollView>

          {/* dots */}
          <View style={styles.dotContainer}>
            {offers.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    width: activeIndex === i ? 18 : 6,
                    backgroundColor: activeIndex === i ? "#FFF" : "rgba(255,255,255,0.4)",
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.contentWrap}>
          {/* Info Banners in Premium Containers */}
          <View style={styles.infoBannerRow}>
            <View style={styles.infoCard}>
              <Image source={AllergyAlert} style={styles.infoBannerImg} />
            </View>
            <View style={styles.infoCard}>
              <Image source={Rating5} style={styles.infoBannerImg} />
            </View>
          </View>

          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Explore Our Locations</Text>
            <View style={styles.listLine} />
          </View>

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
  topSection: {
    paddingBottom: 0, // Slider fills to the bottom
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    zIndex: 10,
    overflow: "hidden", // Clip the full-width slider to the rounded corners
  },
  searchWrapper: {
    paddingHorizontal: 16,
    backgroundColor: "transparent",
    marginTop: 10,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  searchLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    fontSize: 14 * scale,
    color: "#222",
    fontFamily: "PoppinsMedium",
    marginLeft: 10,
  },
  searchDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#E5E5E5",
    marginHorizontal: 10,
  },
  micButton: {
    padding: 2,
  },
  sliderContainer: {
    marginTop: 15,
    position: 'relative',
  },
  sliderPage: {
    width: width,
    alignItems: "center",
  },
  offerCardWrapper: {
    width: width, // Full width spread
    height: 160 * scale,
    overflow: "hidden",
    paddingHorizontal: 24 * scale,
    paddingVertical: 20 * scale,
    justifyContent: "center",
    position: 'relative',
  },
  offerCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 2,
  },
  offerTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  offerBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    color: "#FFF",
    fontSize: 10 * scale,
    fontFamily: "PoppinsSemiBold",
    letterSpacing: 1,
    marginBottom: 8,
  },
  offerMainTitle: {
    fontSize: 22 * scale,
    fontFamily: "PoppinsSemiBold",
    color: "#FFF",
    lineHeight: 28 * scale,
  },
  offerDesc: {
    fontSize: 12 * scale,
    fontFamily: "PoppinsMedium",
    color: "rgba(255,255,255,0.9)",
    marginTop: 6,
  },
  offerIconCircle: {
    width: 66 * scale,
    height: 66 * scale,
    borderRadius: 33 * scale,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  decorCircle1: {
    position: 'absolute',
    width: 150 * scale,
    height: 150 * scale,
    borderRadius: 75 * scale,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: -40,
    right: -40,
  },
  decorCircle2: {
    position: 'absolute',
    width: 80 * scale,
    height: 80 * scale,
    borderRadius: 40 * scale,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -15,
    left: -15,
  },
  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    position: 'absolute',
    bottom: 12,
    width: '100%',
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  infoBannerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 8,
    width: (width - 44) / 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  infoBannerImg: {
    width: '100%',
    height: 90 * scale,
    borderRadius: 6,
    resizeMode: "contain",
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 5,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18 * scale,
    fontFamily: "PoppinsSemiBold",
    color: "#1C1C1C",
  },
  sectionSubtitle: {
    fontSize: 12 * scale,
    fontFamily: "PoppinsMedium",
    color: "#888",
    marginTop: -2,
  },
  viewAllText: {
    fontSize: 13 * scale,
    fontFamily: "PoppinsSemiBold",
    color: "#E23744",
  },
  contentWrap: {
    paddingTop: 10,
    backgroundColor: 'transparent',
  },
  listHeader: {
    paddingHorizontal: 24,
    marginTop: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  listTitle: {
    fontSize: 16 * scale,
    fontFamily: "PoppinsBold",
    color: "#333",
    marginRight: 15,
  },
  listLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#E0E0E0",
    borderRadius: 1,
  },
  voiceOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  voiceOverlayInner: {
    width: '100%',
    height: '100%',
    justifyContent: "center",
    alignItems: "center",
  },
  voiceText: {
    fontSize: 24 * scale,
    fontFamily: "PoppinsBold",
    color: "#FFF",
    marginTop: 20,
  },
  voiceSubtext: {
    fontSize: 14 * scale,
    fontFamily: "PoppinsMedium",
    color: "rgba(255,255,255,0.8)",
    marginTop: 10,
  },
  voiceClose: {
    position: 'absolute',
    bottom: 50,
  },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F8F8F8',
  },
  cardBody: {
    flexDirection: "row",
    padding: 12,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: 110 * scale,
    height: 110 * scale,
    borderRadius: 8,
  },
  premiumBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  premiumText: {
    color: '#FFD700',
    fontSize: 6 * scale,
    fontFamily: 'PoppinsSemiBold',
    marginLeft: 3,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 15 * scale,
    color: "#1C1C1C",
    fontFamily: "PoppinsSemiBold",
    flex: 1,
    marginRight: 10,
  },
  vegBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  vegText: {
    marginLeft: 4,
    color: "#16a34a",
    fontSize: 13 * scale,
    fontFamily: "PoppinsMedium",
  },
  addressRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  address: {
    fontSize: 14 * scale,
    color: "#666",
    marginLeft: 5,
    lineHeight: 18 * scale,
    fontFamily: "PoppinsMedium",
    flex: 1,
  },
  serviceRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  serviceChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  serviceChipText: {
    marginLeft: 5,
    fontSize: 11 * scale,
    color: "#444",
    fontFamily: "PoppinsMedium",
  },
});
