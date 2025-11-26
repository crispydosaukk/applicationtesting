// Categories.js
import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, Image, TouchableOpacity, Dimensions, ActivityIndicator, ScrollView, Modal } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useIsFocused } from "@react-navigation/native";

import AppHeader from "../AppHeader";
import BottomBar from "../BottomBar";
import MenuModal from "../MenuModal";
import LinearGradient from "react-native-linear-gradient";
import { fetchCategories } from "../../services/categoryService";
import { fetchRestaurantDetails, fetchRestaurantTimings } from "../../services/restaurantService";
import { getCart } from "../../services/cartService";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 50) / 2;

export default function Categories({ route = {}, navigation }) {
  const { userId } = (route && route.params) || {};

  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [timings, setTimings] = useState([]);
  const [timingsLoading, setTimingsLoading] = useState(false);
  const [todayTiming, setTodayTiming] = useState(null);

  const [menuVisible, setMenuVisible] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const isFocused = useIsFocused();

  const sliderImages = [
    require("../../assets/loyalty.png"),
    require("../../assets/referal.png"),
    require("../../assets/welcome.png"),
  ];

  useEffect(() => {
    const loadUser = async () => {
      const stored = await AsyncStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    };
    loadUser();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      let next = activeIndex + 1;
      if (next >= sliderImages.length) next = 0;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setActiveIndex(next);
    }, 3000);
    return () => clearInterval(timer);
  }, [activeIndex]);

  useEffect(() => {
    let mounted = true;
    const loadRestaurant = async () => {
      if (!userId) return;
      try {
        const data = await fetchRestaurantDetails(userId);
        if (mounted && data) setRestaurant(data);
      } catch (e) {
        console.log("Restaurant fetch error:", e);
      }
    };
    loadRestaurant();
    return () => (mounted = false);
  }, [userId]);

  useEffect(() => {
    let mounted = true;
    const loadCategories = async () => {
      try {
        const data = await fetchCategories(userId);
        if (mounted) setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.log("Category Load Error:", err);
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
        if (data && data.length) {
          const dayOrder = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
          const todayIndex = new Date().getDay();
          const todayName = dayOrder[todayIndex];
          const todayData = data.find((d) => d.day === todayName);
          setTodayTiming(todayData || null);
        }
      } catch (e) {
        console.log("Error fetching timings:", e);
      }
    };
    loadTodayTiming();
  }, [restaurant]);

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
            if (qty > 0) map[item.product_id] = (map[item.product_id] || 0) + qty;
          });
          setCartItems(map);
        }
      } catch (err) {
        console.log("Cart fetch error:", err);
      }
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
    } catch (e) {
      console.log("Error fetching timings:", e);
    } finally {
      setTimingsLoading(false);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    (cat?.name || "").toLowerCase().includes(searchText.toLowerCase())
  );

    const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      activeOpacity={0.9}
      onPress={() =>
        navigation.navigate("Products", {
          userId: userId,
          categoryId: item.id,
        })
      }
    >
      <Image
        source={item?.image ? { uri: item.image } : require("../../assets/restaurant.png")}
        style={styles.categoryImage}
      />
      <Text style={styles.categoryText} numberOfLines={1}>{item?.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AppHeader user={user} navigation={navigation} onMenuPress={() => setMenuVisible(true)} cartItems={cartItems} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        
        {/* 🔥 PREMIUM SLIDER */}
        <View style={{ marginTop: 15 }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            ref={scrollRef}
            onScroll={(e) => setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
            scrollEventThrottle={16}
          >
            {sliderImages.map((img, i) => (
              <View key={i} style={{ width }}>
                <Image source={img} style={styles.sliderImage} />
              </View>
            ))}
          </ScrollView>

          <View style={styles.dotContainer}>
            {sliderImages.map((_, i) => (
              <View key={i} style={[styles.dot, { width: activeIndex === i ? 22 : 8, opacity: activeIndex === i ? 1 : 0.4 }]} />
            ))}
          </View>
        </View>

        {restaurant && (
          <LinearGradient
            colors={["#ffdfdf", "#ffeceb", "#e9ffee", "#d7f8d7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.restaurantInfo}
          >
            <Image
              source={
                restaurant?.restaurant_photo
                  ? { uri: restaurant.restaurant_photo }
                  : require("../../assets/restaurant.png")
              }
              style={styles.restaurantImg}
            />

            {/* NAME */}
            <View style={styles.infoRow}>
              <Ionicons name="restaurant" size={20} color="#333" style={styles.infoIcon} />
              <Text style={styles.restaurantName}>{restaurant?.restaurant_name || "Restaurant Name"}</Text>
            </View>

            {/* ADDRESS */}
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color="#333" style={styles.infoIcon} />
              <Text style={styles.restaurantAddress}>{restaurant?.restaurant_address || "Restaurant Address"}</Text>
            </View>

            {/* PHONE */}
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color="#333" style={styles.infoIcon} />
              <Text style={styles.restaurantPhone}>{restaurant?.restaurant_phonenumber || "Phone Number"}</Text>
            </View>

            {/* TODAY TIMING */}
            <View style={[styles.infoRow, { marginTop: 6 }]}>
              <Ionicons name="time" size={20} color="#333" style={styles.infoIcon} />

              {todayTiming ? (
                todayTiming.is_active ? (
                  <Text style={styles.todayTimingText}>
                    {todayTiming.opening_time} - {todayTiming.closing_time}
                  </Text>
                ) : (
                  <Text style={styles.todayTimingTextClosed}>Closed Today</Text>
                )
              ) : (
                <Text style={styles.todayTimingText}>Loading...</Text>
              )}

              <TouchableOpacity style={styles.viewTimingsBtn} onPress={openTimingsModal}>
                <Text style={styles.viewTimingsText}>View</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        )}


        {/* 🔥 SEARCH BAR */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={20} color="#999" style={{ marginLeft: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
            placeholderTextColor="#888"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* 🔥 CATEGORIES GRID */}
        {loading ? (
          <ActivityIndicator size="large" color="#000" style={{ marginTop: 30 }} />
        ) : (
          <FlatList
            data={filteredCategories}
            renderItem={renderCategory}
            numColumns={2}
            keyExtractor={(item) => (item?.id ?? Math.random()).toString()}
            contentContainerStyle={styles.grid}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        )}
      </ScrollView>

      <MenuModal visible={menuVisible} setVisible={setMenuVisible} user={user} navigation={navigation} />

      <BottomBar navigation={navigation} />

      {/* 🔥 TIMINGS MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Restaurant Timings</Text>

            {timingsLoading ? (
              <ActivityIndicator size="large" style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={timings}
                keyExtractor={(item) => item.day}
                renderItem={({ item }) => (
                  <View style={styles.row}>
                    <Text style={styles.day}>{item.day}</Text>
                    {item.is_active ? (
                      <Text style={styles.time}>{item.opening_time} - {item.closing_time}</Text>
                    ) : (
                      <Text style={styles.closed}>Closed</Text>
                    )}
                  </View>
                )}
              />
            )}

            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },

  sliderImage: { width: width - 20, height: 180, alignSelf: "center", borderRadius: 5, marginTop: 10, resizeMode: "cover" },
  dotContainer: { flexDirection: "row", justifyContent: "center", marginTop: 8 },
  dot: { height: 8, borderRadius: 5, backgroundColor: "#333", marginHorizontal: 4 },
  infoRow: { flexDirection: "row", alignItems: "center", width: "100%", marginBottom: 4 },
  infoIcon: { marginRight: 10, color: "#333" },

  restaurantInfo: { marginHorizontal: 20, marginTop: 20, alignItems: "center", padding: 20, borderRadius: 5, elevation: 6, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8 },
  restaurantImg: { width: 120, height: 120, borderRadius: 20, marginBottom: 12, backgroundColor: "#e1e1e1" },
  restaurantName: { fontSize: 20, fontWeight: "700", color: "#111", marginBottom: 4 },
  restaurantAddress: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 2 },
  restaurantPhone: { fontSize: 14, fontWeight: "600", color: "#222", marginBottom: 10 },

  todayTimingWrapper: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  todayTimingText: { fontSize: 14, fontWeight: "600", color: "#1b7a41", marginRight: 10 },
  todayTimingTextClosed: { fontSize: 14, fontWeight: "600", color: "#e63946", marginRight: 10 },

  viewTimingsBtn: { backgroundColor: "#d1fae5", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  viewTimingsText: { fontWeight: "700", color: "#065f46" },

  searchWrapper: { marginTop: 16, marginHorizontal: 15, backgroundColor: "#fff", borderRadius: 14, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, elevation: 3, height: 50, marginBottom: 14 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: "#333" },

  grid: { paddingHorizontal: 10, paddingBottom: 60 },

  categoryCard: { backgroundColor: "#fff", borderRadius: 5, margin: 10, width: ITEM_WIDTH, alignItems: "center", elevation: 5, padding: 12, shadowColor: "#000", shadowOpacity: 0.1 },
  categoryImage: { width: ITEM_WIDTH - 20, height: ITEM_WIDTH - 20, borderRadius: 14, resizeMode: "cover" },
  categoryText: { marginTop: 10, fontSize: 15, fontWeight: "700", color: "#222" },

  modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "85%", backgroundColor: "#fff", borderRadius: 20, padding: 20, maxHeight: "80%", elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 15, textAlign: "center" },

  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  day: { fontSize: 16, fontWeight: "600", color: "#333" },
  time: { fontSize: 16, color: "#222" },
  closed: { fontSize: 16, color: "#e63946", fontWeight: "700" },

  closeBtn: { marginTop: 20, backgroundColor: "#d1fae5", paddingVertical: 12, borderRadius: 12 },
  closeText: { fontSize: 16, fontWeight: "700", color: "#065f46", textAlign: "center" },
});
