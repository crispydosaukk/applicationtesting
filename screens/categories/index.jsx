// Categories.js
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

export default function Categories({ route = {}, navigation }) {
  const { userId } = (route && route.params) || {};

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
  const isFocused = useIsFocused();
  const formatTime = (timeStr) => {
  if (!timeStr) return "";
  // Handles "HH:MM:SS" or "HH:MM"
  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return timeStr; // fallback
};

  const animatedTexts = [
    "Earn £0.25 on every order",
    "Loyalty points earn £0.25 on referring a friend",
    "Earn £0.25 welcome gift on first sign up",
  ];

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const animateText = () => {
      fadeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTextIndex((prev) => (prev + 1) % animatedTexts.length);
        animateText();
      });
    };
    animateText();
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      const stored = await AsyncStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const loadRestaurant = async () => {
      try {
        const data = await fetchRestaurantDetails(userId);
        setRestaurant(data);
      } catch (e) {
        console.log("Restaurant fetch error:", e);
      }
    };
    loadRestaurant();
  }, [userId]);

  useEffect(() => {
    let mounted = true;
    const loadCategories = async () => {
      try {
        const data = await fetchCategories(userId);
        if (mounted) setCategories(Array.isArray(data) ? data : []);
      } catch {
        if (mounted) setCategories([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadCategories();
    return () => (mounted = false);
  }, [userId]);

  useEffect(() => {
    if (!restaurant?.id) return;

    const loadTodayTiming = async () => {
      try {
        const data = await fetchRestaurantTimings(restaurant.id);
        if (data?.length) {
          const dayOrder = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ];
          const todayName = dayOrder[new Date().getDay()];
          const todayData = data.find((d) => d.day === todayName);
          setTodayTiming(todayData || null);
        }
      } catch (e) {}
    };
    loadTodayTiming();
  }, [restaurant]);

  useEffect(() => {
    if (!user) return;
    const fetchCart = async () => {
      const customerId = user.id ?? user.customer_id;
      if (!customerId) return;

      try {
        const res = await getCart(customerId);
        if (res?.status === 1 && Array.isArray(res.data)) {
          const map = {};
          res.data.forEach((item) => {
            const qty = item.product_quantity || 0;
            if (qty > 0)
              map[item.product_id] =
                (map[item.product_id] || 0) + qty;
          });
          setCartItems(map);
        }
      } catch {}
    };

    if (isFocused) fetchCart();
  }, [isFocused, user]);

  const openTimingsModal = async () => {
    if (!restaurant?.id) return;
    setTimingsLoading(true);
    setModalVisible(true);

    try {
      const data = await fetchRestaurantTimings(restaurant.id);
      setTimings(data || []);
    } finally {
      setTimingsLoading(false);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    (cat?.name || "")
      .toLowerCase()
      .includes(searchText.toLowerCase())
  );

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() =>
        navigation.navigate("Products", {
          userId: userId,
          categoryId: item.id,
        })
      }
      activeOpacity={0.85}
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

  return (
    <View style={styles.container}>
      <AppHeader
        user={user}
        navigation={navigation}
        onMenuPress={() => setMenuVisible(true)}
        cartItems={cartItems}
      />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View style={styles.animatedTextWrapper}>
          <Ionicons name="gift-outline" size={22} color="#008060" style={{ marginRight: 8 }} />
          <Animated.Text
            style={[
              styles.animatedText,
              { opacity: fadeAnim },
            ]}
          >
            {animatedTexts[textIndex]}
          </Animated.Text>
        </View>

        {restaurant && (
          <View style={styles.restaurantCard}>
            <View style={styles.restaurantImageContainer}>
              <Image
                source={
                  restaurant?.restaurant_photo
                    ? { uri: restaurant.restaurant_photo }
                    : require("../../assets/restaurant.png")
                }
                style={styles.restaurantFullImage}
                resizeMode="cover"
              />

              <LinearGradient
                colors={[
                  "rgba(0,0,0,0.85)",
                  "rgba(0,0,0,0.55)",
                  "rgba(0,0,0,0.2)",
                  "transparent",
                ]}
                style={styles.overlay}
              />

              <View style={styles.overlayTextWrapper}>
                <Text style={styles.overlayTitle}>
                  {restaurant?.restaurant_name}
                </Text>

                <View style={styles.overlayRow}>
                  <Ionicons name="location-outline" color="#fff" size={18} />
                  <Text style={styles.overlaySubText} numberOfLines={2}>
                    {restaurant?.restaurant_address}
                  </Text>
                </View>

                <View style={styles.overlayRow}>
                  <Ionicons name="call-outline" color="#fff" size={18} />
                  <Text style={styles.overlaySubText}>
                    {restaurant?.restaurant_phonenumber}
                  </Text>
                </View>

                <View style={styles.overlayRow}>
                  <Ionicons name="time-outline" color="#fff" size={18} />
                  <View style={styles.collectionWrapper}>
                    <View style={styles.collectionBadge}>
                      <Ionicons
                        name="bag-handle-outline"
                        size={14}
                        color="#fff"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.collectionText}>
                        Collection available
                      </Text>
                    </View>
                    {todayTiming ? (
                      todayTiming.is_active ? (
                        <Text style={styles.overlayTimeText}>
                          {formatTime(todayTiming.opening_time)} - {formatTime(todayTiming.closing_time)}
                        </Text>
                      ) : (
                        <Text style={styles.overlayClosed}>Closed Today</Text>
                      )
                    ) : (
                      <Text style={styles.overlayTimeText}>Loading...</Text>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={openTimingsModal}
                    style={styles.overlayViewBtn}
                  >
                    <Text style={styles.overlayViewText}>View More</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={20} color="#888" />
          <TextInput
            placeholder="Search categories..."
            style={styles.searchInput}
            placeholderTextColor="#aaa"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            style={{ marginTop: 30 }}
          />
        ) : (
          <FlatList
            data={filteredCategories}
            renderItem={renderCategory}
            numColumns={2}
            scrollEnabled={false}
            keyExtractor={(item) =>
              (item?.id ?? Math.random()).toString()
            }
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

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Restaurant Timings
            </Text>

            {timingsLoading ? (
              <ActivityIndicator style={{ marginTop: 20 }} size="large" />
            ) : (
              <FlatList
                data={timings}
                keyExtractor={(i) => i.day}
                renderItem={({ item }) => (
                  <View style={styles.row}>
                    <Text style={styles.day}>{item.day}</Text>
                    {item.is_active ? (
                      <Text style={styles.time}>
                        {formatTime(item.opening_time)} - {formatTime(item.closing_time)}
                      </Text>
                    ) : (
                      <Text style={styles.closed}>Closed</Text>
                    )}
                  </View>
                )}
              />
            )}

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  animatedTextWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e9fef3",
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 5,
    marginTop: 15,
    elevation: 3,
  },
  animatedText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#00704a",
  },

  restaurantCard: {
    marginHorizontal: 18,
    marginTop: 18,
    borderRadius: 5,
    overflow: "hidden",
    elevation: 8,
    backgroundColor: "#fff",
  },

  restaurantImageContainer: {
    width: "100%",
    height: 260,
    borderRadius: 5,
    overflow: "hidden",
    backgroundColor: "#000",
  },

  restaurantFullImage: {
    width: "100%",
    height: "100%",
  },

  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "100%",
  },

  overlayTextWrapper: {
    position: "absolute",
    bottom: 16,
    left: 14,
    right: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 5,
  },

  overlayTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },

  overlayRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  overlaySubText: {
    color: "#fff",
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    flexShrink: 1,
  },

  collectionWrapper: {
    marginLeft: 8,
    flexShrink: 1,
  },

  collectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28a745",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
    alignSelf: "flex-start",
  },

  collectionText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },

  overlayTimeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 4,
  },

  overlayClosed: {
    color: "#ffdddd",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 4,
  },

  overlayViewBtn: {
    marginLeft: 10,
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 5,
  },

  overlayViewText: {
    color: "#09f65cff",
    fontSize: 13,
    fontWeight: "700",
  },

  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 18,
    paddingHorizontal: 12,
    borderRadius: 5,
    elevation: 3,
    height: 48,
    marginTop: 15,
  },
  searchInput: {
    marginLeft: 10,
    flex: 1,
    fontSize: 15,
    color: "#222",
  },

  grid: { paddingHorizontal: 10, paddingBottom: 60 },

  categoryCard: {
    backgroundColor: "#fff",
    width: (width - 60) / 2,
    margin: 10,
    borderRadius: 5,
    padding: 10,
    alignItems: "center",
    elevation: 4,
  },
  categoryImage: {
    width: (width - 60) / 2 - 30,
    height: (width - 60) / 2 - 30,
    borderRadius: 5,
  },
  categoryText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 5,
    elevation: 10,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  row: {
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  day: { fontSize: 16, fontWeight: "600", color: "#333" },
  time: { fontSize: 16, color: "#222" },
  closed: { fontSize: 16, color: "#d62828", fontWeight: "700" },

  closeBtn: {
    backgroundColor: "#e8fff3",
    paddingVertical: 12,
    borderRadius: 5,
    marginTop: 15,
  },
  closeText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#00704a",
  },
});
