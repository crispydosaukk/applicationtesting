import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, Image, TouchableOpacity, Dimensions, ActivityIndicator, ScrollView, Modal, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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

  const animatedTexts = ["EARN £0.25 ON EVERY ORDER", "REFER & EARN £0.25", "£0.25 WELCOME BONUS"];

  const formatTime = (t) => (!t ? "" : t.slice(0, 5));

  useEffect(() => {
    const animate = () => {
      fadeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.delay(1500),
        Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true })
      ]).start(() => {
        setTextIndex((p) => (p + 1) % animatedTexts.length);
        animate();
      });
    };
    animate();
  }, []);

  useEffect(() => { (async () => { const s = await AsyncStorage.getItem("user"); if (s) setUser(JSON.parse(s)); })(); }, []);
  useEffect(() => { if (!userId) return; (async () => { const d = await fetchRestaurantDetails(userId); setRestaurant(d); })(); }, [userId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const d = await fetchCategories(userId);
      if (mounted) setCategories(Array.isArray(d) ? d : []);
      setLoading(false);
    })();
    return () => (mounted = false);
  }, [userId]);

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

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const id = user.id ?? user.customer_id;
      if (!id) return;
      const res = await getCart(id);
      if (res?.status === 1) {
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
    <TouchableOpacity style={styles.categoryCard} activeOpacity={0.85} onPress={() => navigation.navigate("Products", { userId, categoryId: item.id })}>
      <Image source={item?.image ? { uri: item.image } : require("../../assets/restaurant.png")} style={styles.categoryImage} />
      <Text style={styles.categoryText} numberOfLines={1}>{item?.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader user={user} navigation={navigation} onMenuPress={() => setMenuVisible(true)} cartItems={cartItems} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
        <View style={styles.offerWrapper}>
          <Ionicons name="gift-outline" size={18} color="#00704a" />
          <Animated.Text style={[styles.offerText, { opacity: fadeAnim }]} numberOfLines={1}>
            {animatedTexts[textIndex]}
          </Animated.Text>
        </View>

        {restaurant && (
          <View style={styles.restaurantCard}>
            <Image source={restaurant?.restaurant_photo ? { uri: restaurant.restaurant_photo } : require("../../assets/restaurant.png")} style={styles.restaurantImage} />
            <LinearGradient colors={["rgba(0,0,0,0.85)", "transparent"]} style={styles.overlay} />
            <View style={styles.overlayContent}>
              <Text style={styles.restaurantTitle}>{restaurant.restaurant_name}</Text>
              <View style={styles.overlayRow}>
                <Ionicons name="location-outline" size={14} color="#fff" />
                <Text style={styles.overlayText} numberOfLines={1}>{restaurant.restaurant_address}</Text>
              </View>
              <View style={styles.overlayRow}>
                <Ionicons name="call-outline" size={14} color="#fff" />
                <Text style={styles.overlayText}>{restaurant.restaurant_phonenumber}</Text>
              </View>
              <View style={styles.overlayRow}>
                <Ionicons name="time-outline" size={14} color="#fff" />
                <Text style={styles.overlayText}>
                  {todayTiming ? (todayTiming.is_active ? `${formatTime(todayTiming.opening_time)} - ${formatTime(todayTiming.closing_time)}` : "Closed Today") : "Loading..."}
                </Text>
                <TouchableOpacity onPress={openTimingsModal}><Text style={styles.viewMore}>View More</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#777" />
          <TextInput style={styles.searchInput} placeholder="Search categories..." placeholderTextColor="#aaa" value={searchText} onChangeText={setSearchText} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 20 }} />
        ) : (
          <FlatList data={filteredCategories} numColumns={2} renderItem={renderCategory} scrollEnabled={false} keyExtractor={(i) => i.id.toString()} contentContainerStyle={styles.grid} />
        )}
      </ScrollView>

      <MenuModal visible={menuVisible} setVisible={setMenuVisible} user={user} navigation={navigation} />
      <BottomBar navigation={navigation} />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalWrapper}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Restaurant Timings</Text>
            {timingsLoading ? (
              <ActivityIndicator size="large" />
            ) : (
              <FlatList data={timings} keyExtractor={(i) => i.day} renderItem={({ item }) => (
                <View style={styles.modalRow}>
                  <Text style={styles.dayText}>{item.day}</Text>
                  <Text style={styles.timeText}>{item.is_active ? `${formatTime(item.opening_time)} - ${formatTime(item.closing_time)}` : "Closed"}</Text>
                </View>
              )} />
            )}
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  offerWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#22cc1fff", marginHorizontal: 18, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, marginTop: 12, elevation: 2 },
  offerText: { fontSize: 16, fontWeight: "600", marginLeft: 8, color: "#f3f5f3ff", width: width * 0.6 },
  restaurantCard: { marginHorizontal: 18, marginTop: 14, borderRadius: 8, overflow: "hidden", elevation: 4 },
  restaurantImage: { width: "100%", height: 210 },
  overlay: { position: "absolute", top: 0, bottom: 0, width: "100%" },
  overlayContent: { position: "absolute", bottom: 12, left: 12, right: 12 },
  restaurantTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  overlayRow: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  overlayText: { color: "#fff", marginLeft: 6, fontSize: 13, flexShrink: 1 },
  viewMore: { color: "#16f58d", fontSize: 12, marginLeft: 10, fontWeight: "700" },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", marginHorizontal: 18, paddingHorizontal: 12, height: 45, borderRadius: 6, elevation: 2, marginTop: 16 },
  searchInput: { marginLeft: 10, fontSize: 14, flex: 1, color: "#222" },
  grid: { paddingHorizontal: 12, paddingTop: 14, paddingBottom: 30 },
  categoryCard: { width: (width - 48) / 2, backgroundColor: "#fff", borderRadius: 6, padding: 10, margin: 8, alignItems: "center", elevation: 3 },
  categoryImage: { width: "100%", height: (width - 48) / 2 - 40, borderRadius: 6 },
  categoryText: { marginTop: 8, fontSize: 14, fontWeight: "700", color: "#222" },
  modalWrapper: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" },
  modalBox: { width: "85%", backgroundColor: "#fff", borderRadius: 6, padding: 18, elevation: 8, maxHeight: "80%" },
  modalTitle: { fontSize: 18, fontWeight: "700", textAlign: "center", marginBottom: 12 },
  modalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderColor: "#eee" },
  dayText: { fontSize: 14, fontWeight: "600" },
  timeText: { fontSize: 14, fontWeight: "600", color: "#333" },
  closeBtn: { marginTop: 12, paddingVertical: 10, backgroundColor: "#e6fff2", borderRadius: 6 },
  closeText: { textAlign: "center", fontSize: 15, fontWeight: "700", color: "#007d54" }
});
