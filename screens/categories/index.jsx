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
} from "react-native";
import AppHeader from "../AppHeader";
import { fetchCategories } from "../../services/categoryService";
import { fetchRestaurantDetails, fetchRestaurantTimings } from "../../services/restaurantService";
import Ionicons from "react-native-vector-icons/Ionicons";
import BottomBar from "../BottomBar";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 50) / 2;

export default function Categories({ route = {}, navigation }) {
  const { userId } = (route && route.params) || {};

  const [restaurant, setRestaurant] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [timings, setTimings] = useState([]);
  const [timingsLoading, setTimingsLoading] = useState(false);
  const [todayTiming, setTodayTiming] = useState(null);

  const sliderImages = [
    require("../../assets/loyalty.png"),
    require("../../assets/referal.png"),
    require("../../assets/welcome.png"),
  ];

  // Auto-scroll slider
  useEffect(() => {
    const timer = setInterval(() => {
      let next = activeIndex + 1;
      if (next >= sliderImages.length) next = 0;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setActiveIndex(next);
    }, 3000);
    return () => clearInterval(timer);
  }, [activeIndex]);

  // Fetch restaurant details dynamically
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

  // Load categories
  useEffect(() => {
    let mounted = true;
    const loadCategories = async () => {
      try {
        const data = await fetchCategories(userId);
        if (mounted) setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.log("Category Load Error:", error);
        if (mounted) setCategories([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadCategories();
    return () => (mounted = false);
  }, [userId]);

  // Load today's timing
  useEffect(() => {
    if (!restaurant?.id) return;

    const loadTodayTiming = async () => {
      try {
        const data = await fetchRestaurantTimings(restaurant.id);
        if (data && data.length) {
          const dayOrder = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          const todayIndex = new Date().getDay(); // Sunday=0
          const todayName = dayOrder[todayIndex];
          const todayData = data.find(d => d.day === todayName);
          setTodayTiming(todayData || null);
        }
      } catch (e) {
        console.log("Error fetching timings:", e);
      }
    };

    loadTodayTiming();
  }, [restaurant]);

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
      activeOpacity={0.85}
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
      <Text style={styles.categoryText} numberOfLines={1}>
        {item?.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AppHeader user={restaurant} navigation={navigation} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        {/* Slider & Restaurant Info */}
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

        {restaurant && (
          <View style={styles.restaurantInfo}>
            <Image
              source={restaurant?.restaurant_photo ? { uri: restaurant.restaurant_photo } : require("../../assets/restaurant.png")}
              style={styles.restaurantImg}
            />
            <Text style={styles.restaurantName}>{restaurant?.restaurant_name || "Restaurant Name"}</Text>
            <Text style={styles.restaurantAddress}>{restaurant?.restaurant_address || "Restaurant Address"}</Text>
            <Text style={styles.restaurantPhone}>📞 {restaurant?.restaurant_phonenumber || "Phone Number"}</Text>

            {/* Today's Timing + View Timings */}
            <View style={styles.todayTimingWrapper}>
              {todayTiming ? (
                todayTiming.is_active ? (
                  <Text style={styles.todayTimingText}>
                    Today's Timing: {todayTiming.opening_time} - {todayTiming.closing_time}
                  </Text>
                ) : (
                  <Text style={styles.todayTimingTextClosed}>Today's Timing: Closed</Text>
                )
              ) : (
                <Text style={styles.todayTimingText}>Today's Timing: Loading...</Text>
              )}
              <TouchableOpacity style={styles.viewTimingsBtn} onPress={openTimingsModal}>
                <Text style={styles.viewTimingsText}>View Timings</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Search Bar */}
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

        {/* Categories Grid */}
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

      <BottomBar navigation={navigation} />

      {/* Timings Modal */}
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
  sliderImage: { width: width - 20, height: 180, alignSelf: "center", borderRadius: 10, marginTop: 10, resizeMode: "cover" },
  dotContainer: { flexDirection: "row", justifyContent: "center", marginTop: 8 },
  dot: { height: 8, borderRadius: 5, backgroundColor: "#444", marginHorizontal: 4 },
  restaurantInfo: { marginHorizontal: 20, marginTop: 20, alignItems: "center", backgroundColor: "#f9f9f9", padding: 16, borderRadius: 16 },
  restaurantImg: { width: 120, height: 120, borderRadius: 16, marginBottom: 12, backgroundColor: "#e2e2e2" },
  restaurantName: { fontSize: 20, fontWeight: "bold", color: "#111", marginBottom: 6 },
  restaurantAddress: { fontSize: 14, color: "#555", textAlign: "center", marginBottom: 4 },
  restaurantPhone: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 12 },
  todayTimingWrapper: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  todayTimingText: { fontSize: 14, fontWeight: "600", color: "#333", marginRight: 10 },
  todayTimingTextClosed: { fontSize: 14, fontWeight: "600", color: "#ff3b30", marginRight: 10 },
  viewTimingsBtn: { backgroundColor: "#a7f3d0", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
  viewTimingsText: { fontWeight: "700", color: "#071029" },
  searchWrapper: { marginTop: 14, marginHorizontal: 15, backgroundColor: "#fff", borderRadius: 12, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, elevation: 3, height: 50, marginBottom: 12 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: "#333" },
  grid: { paddingHorizontal: 10, paddingBottom: 60 },
  categoryCard: { backgroundColor: "#fff", borderRadius: 14, margin: 10, width: ITEM_WIDTH, alignItems: "center", elevation: 4, padding: 12 },
  categoryImage: { width: ITEM_WIDTH - 20, height: ITEM_WIDTH - 20, borderRadius: 12 },
  categoryText: { marginTop: 10, fontSize: 16, fontWeight: "600", color: "#333" },
  modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "85%", backgroundColor: "#fff", borderRadius: 16, padding: 20, maxHeight: "80%" },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 15, textAlign: "center" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  day: { fontSize: 16, fontWeight: "600" },
  time: { fontSize: 16, color: "#333" },
  closed: { fontSize: 16, color: "#ff3b30", fontWeight: "700" },
  closeBtn: { marginTop: 20, backgroundColor: "#a7f3d0", paddingVertical: 12, borderRadius: 12 },
  closeText: { fontSize: 16, fontWeight: "700", color: "#071029", textAlign: "center" },
});
