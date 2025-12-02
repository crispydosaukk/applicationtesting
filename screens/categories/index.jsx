import React, { useEffect, useRef, useState } from "react";
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
  ScrollView,
  Modal,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useIsFocused } from "@react-navigation/native";
import AppHeader from "../AppHeader";
import BottomBar from "../BottomBar";
import MenuModal from "../MenuModal";
import LinearGradient from "react-native-linear-gradient";
import { fetchCategories } from "../../services/categoryService";
import {
  fetchRestaurantDetails,
  fetchRestaurantTimings,
} from "../../services/restaurantService";
import { getCart } from "../../services/cartService";

const { width } = Dimensions.get("window");
const scale = width / 400;

export default function Categories({ route, navigation }) {
  const { userId } = route?.params || {};
  const isFocused = useIsFocused();

  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [timings, setTimings] = useState([]);
  const [timingsLoading, setTimingsLoading] = useState(false);
  const [todayTiming, setTodayTiming] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [cartItems, setCartItems] = useState({});

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [textIndex, setTextIndex] = useState(0);
  const animatedTexts = [
    "EARN £0.25 ON EVERY ORDER",
    "REFER & EARN £0.25",
    "£0.25 WELCOME BONUS",
  ];

  const formatTime = (t) => (!t ? "" : t.slice(0, 5));

  // offer text animation
  useEffect(() => {
    const animate = () => {
      fadeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTextIndex((p) => (p + 1) % animatedTexts.length);
        animate();
      });
    };
    animate();
  }, []);

  // load user
  useEffect(() => {
    (async () => {
      const s = await AsyncStorage.getItem("user");
      if (s) setUser(JSON.parse(s));
    })();
  }, []);

  // restaurant details
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const d = await fetchRestaurantDetails(userId);
      setRestaurant(d);
    })();
  }, [userId]);

  // categories
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const d = await fetchCategories(userId);
      if (mounted) setCategories(Array.isArray(d) ? d : []);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [userId]);

  // today timing
  useEffect(() => {
    if (!restaurant?.id) return;
    (async () => {
      const d = await fetchRestaurantTimings(restaurant.id);
      if (!d?.length) return;
      const today = new Date().toLocaleString("en-US", { weekday: "long" });
      const t = d.find((i) => i.day === today);
      setTodayTiming(t || null);
    })();
  }, [restaurant]);

  // cart
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const id = user.id ?? user.customer_id;
      if (!id) return;
      const res = await getCart(id);
      if (res?.status === 1 && Array.isArray(res.data)) {
        const map = {};
        res.data.forEach((i) => {
          if (i.product_quantity > 0) map[i.product_id] = i.product_quantity;
        });
        setCartItems(map);
      }
    };
    if (isFocused) load();
  }, [isFocused, user]);

  const openTimingsModal = async () => {
    if (!restaurant?.id) return;
    setModalVisible(true);
    setTimingsLoading(true);
    const data = await fetchRestaurantTimings(restaurant.id);
    setTimings(data || []);
    setTimingsLoading(false);
  };

  const filteredCategories = categories.filter((c) =>
    (c?.name || "").toLowerCase().includes(searchText.toLowerCase())
  );

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      activeOpacity={0.9}
      onPress={() =>
        navigation.navigate("Products", { userId, categoryId: item.id })
      }
    >
      <Image
        source={
          item?.image
            ? { uri: item.image }
            : require("../../assets/restaurant.png")
        }
        style={styles.categoryImage}
      />
      <Text style={styles.categoryText} numberOfLines={1}>
        {item?.name}
      </Text>
    </TouchableOpacity>
  );

  const timeLabel = todayTiming
    ? todayTiming.is_active
      ? `${formatTime(todayTiming.opening_time)} - ${formatTime(
          todayTiming.closing_time
        )}`
      : "Closed Today"
    : "Loading...";

    const highlightAmount = (text) => {
  const regex = /(£\s?0\.25|£0\.25)/i; // detects £0.25 in any format
  const parts = text.split(regex);

  return (
    <Text style={styles.offerText} numberOfLines={1}>
      {parts[0]}
      {parts[1] && (
        <Text style={styles.offerAmount}>{parts[1]}</Text>
      )}
      {parts[2]}
    </Text>
  );
};

  return (
    // 🔧 only left/right safe insets so we don't double-pad top/bottom
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <AppHeader
        user={user}
        navigation={navigation}
        onMenuPress={() => setMenuVisible(true)}
        cartItems={cartItems}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }} // reduced bottom padding
      >
        {/* OFFER STRIP */}
        <View style={styles.offerWrapper}>
          <Ionicons name="gift-outline" size={18 * scale} color="#ffffff" />
          <Animated.View style={{ opacity: fadeAnim, flex: 1, marginLeft: 10 }}>
            {highlightAmount(animatedTexts[textIndex])}
          </Animated.View>
        </View>

        {/* RESTAURANT CARD */}
        {restaurant && (
          <View style={styles.restaurantCard}>
            <Image
              source={
                restaurant?.restaurant_photo
                  ? { uri: restaurant.restaurant_photo }
                  : require("../../assets/restaurant.png")
              }
              style={styles.restaurantImage}
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.85)"]}
              style={styles.overlay}
            />
            <View style={styles.overlayContent}>
              <View style={styles.glassPanel}>
                <Text style={styles.restaurantTitle}>
                  {restaurant.restaurant_name}
                </Text>

                {/* ADDRESS – 2 lines max */}
                <View style={styles.overlayRow}>
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color="#fff"
                  />
                  <Text
                    style={styles.addressText}
                    numberOfLines={2}
                  >
                    {restaurant.restaurant_address}
                  </Text>
                </View>

                {/* PHONE */}
                <View style={styles.overlayRow}>
                  <Ionicons name="call-outline" size={16} color="#fff" />
                  <Text style={styles.overlayText}>
                    {restaurant.restaurant_phonenumber}
                  </Text>
                </View>

                {/* COLLECTION TIME */}
                <View style={styles.overlayRow}>
                  <Ionicons name="time-outline" size={16} color="#fff" />
                  <View style={{ marginLeft: 8, flex: 1 }}>
                    <Text style={styles.collectionHeading}>
                      Collection Time
                    </Text>
                    <Text style={styles.overlayText}>{timeLabel}</Text>
                  </View>
                  <TouchableOpacity onPress={openTimingsModal}>
                    <Text style={styles.viewMore}>View More</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* SEARCH BOX */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#777" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
            placeholderTextColor="#aaaaaa"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* CATEGORY GRID */}
        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={filteredCategories}
            numColumns={2}
            renderItem={renderCategory}
            scrollEnabled={false}
            keyExtractor={(i) => i.id.toString()}
            contentContainerStyle={styles.grid}
          />
        )}
      </ScrollView>

      <MenuModal
        visible={menuVisible}
        setVisible={setMenuVisible}
        user={user}
        navigation={navigation}
      />
      <BottomBar navigation={navigation} />

      {/* TIMINGS MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalWrapper}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Restaurant Timings</Text>
            {timingsLoading ? (
              <ActivityIndicator size="large" />
            ) : (
              <FlatList
                data={timings}
                keyExtractor={(i) => i.day}
                renderItem={({ item }) => (
                  <View style={styles.modalRow}>
                    <Text style={styles.dayText}>{item.day}</Text>
                    <Text style={styles.timeText}>
                      {item.is_active
                        ? `${formatTime(item.opening_time)} - ${formatTime(
                            item.closing_time
                          )}`
                        : "Closed"}
                    </Text>
                  </View>
                )}
              />
            )}
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeBtn}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
offerAmount: {
  color: "#fffa75",        // premium light-gold
  fontWeight: "900",
  textShadowColor: "rgba(0,0,0,0.35)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
},

  offerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2faa3f",
    marginHorizontal: 18,
    marginTop: 10, // slightly tighter
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 5,
    elevation: 3,
  },
  offerText: {
    fontSize: 13 * scale,
    fontWeight: "700",
    marginLeft: 10,
    color: "#f5fff5",
    width: width * 0.72,
  },

  restaurantCard: {
    marginHorizontal: 18,
    marginTop: 12,
    borderRadius: 5,
    overflow: "hidden",
    elevation: 4,
    backgroundColor: "#000000",
  },
  restaurantImage: {
    width: "100%",
    height: 220,
    resizeMode: "cover",
  },
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "100%",
  },
  overlayContent: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
  },
  glassPanel: {
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 5,
    padding: 10,
  },
  restaurantTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  overlayRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 6,
  },
  addressText: {
    color: "#ffffff",
    marginLeft: 8,
    fontSize: 13,
    flexShrink: 1,
    lineHeight: 18,
  },
  overlayText: {
    color: "#ffffff",
    marginLeft: 8,
    fontSize: 13,
    flexShrink: 1,
  },
  collectionHeading: {
    color: "#b8ffdf",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 2,
  },
  viewMore: {
    color: "#16f58d",
    fontSize: 12,
    marginLeft: 10,
    fontWeight: "700",
    alignSelf: "center",
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    marginHorizontal: 18,
    marginTop: 14,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 10,
    elevation: 3,
  },
  searchInput: {
    marginLeft: 10,
    fontSize: 14,
    flex: 1,
    color: "#222222",
  },

  grid: {
    paddingHorizontal: 10,
    paddingTop: 14,
    paddingBottom: 16, // reduced so bottom looks clean
  },
  categoryCard: {
    width: (width - 52) / 2,
    backgroundColor: "#ffffff",
    borderRadius: 5,
    padding: 12,
    margin: 8,
    alignItems: "center",
    elevation: 3,
  },
  categoryImage: {
  width: "100%",
  height: (width - 52) / 2 - 26,
  borderRadius: 5,
  resizeMode: "contain",   // ⭐ prevents cropping
  backgroundColor: "#fff", // ⭐ avoids empty gaps behind image
},

  categoryText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "700",
    color: "#222222",
  },

  modalWrapper: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    backgroundColor: "#ffffff",
    borderRadius: 5,
    padding: 18,
    elevation: 8,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eeeeee",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "600",
  },
  timeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
  },
  closeBtn: {
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: "#e6fff2",
    borderRadius: 5,
  },
  closeText: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    color: "#007d54",
  },
});
