import React, { useEffect, useState, useRef } from "react";
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
  Animated,
  ScrollView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppHeader from "../AppHeader";
import { fetchCategories } from "../../services/categoryService";
import Ionicons from "react-native-vector-icons/Ionicons";
import BottomBar from "../BottomBar";
import LinearGradient from "react-native-linear-gradient";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 50) / 2;

export default function Categories({ route = {}, navigation }) {
  // guard route.params in case it's undefined
  const { userId } = (route && route.params) || {};

  const [user, setUser] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Original popup states
  const [popupVisible, setPopupVisible] = useState(true);
  const [step, setStep] = useState("chooseType");
  const [collectionType, setCollectionType] = useState(null);
  const [method, setMethod] = useState(null);

  const [carMake, setCarMake] = useState("");
  const [carColor, setCarColor] = useState("");
  const [carReg, setCarReg] = useState("");
  const [showValidationError, setShowValidationError] = useState(false);

  // useRef for animated values (fixed)
  const popupAnim = useRef(new Animated.Value(-500)).current;

  // Restaurant details popup
  const [showRestaurantPopup, setShowRestaurantPopup] = useState(false);

  // Parallax animation for offers (value driven by scroll)
  const scrollY = useRef(new Animated.Value(0)).current;

  // Horizontal offers data
  const offers = [
    { id: "o1", icon: "card-outline", title: "Earn £0.25 on every order", subtitle: "Automatic credit" },
    { id: "o2", icon: "people-outline", title: "£0.25 for referring a friend", subtitle: "Share & earn" },
    { id: "o3", icon: "star-outline", title: "£0.25 Welcome Gift on Signup", subtitle: "First order bonus" },
  ];

  useEffect(() => {
    // load user from AsyncStorage
    let mounted = true;
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser && mounted) setUser(JSON.parse(storedUser));
      } catch (e) {
        console.log("User load error:", e);
      }
    };
    loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    // animate popup when visible (using popupAnim ref)
    if (popupVisible) {
      popupAnim.setValue(-500);
      Animated.spring(popupAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 8,
      }).start();
    }
  }, [popupVisible, popupAnim]);

  useEffect(() => {
    // load categories
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
    return () => {
      mounted = false;
    };
  }, [userId]);

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
      {/* ORIGINAL DELIVERY/COLLECTION POPUP */}
      {popupVisible && (
        <View style={[styles.popupOverlay, { zIndex: 999 }]}>
          <Animated.View style={[styles.popupCard, { transform: [{ translateY: popupAnim }] }]}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setPopupVisible(false)}>
              <Ionicons name="close" size={26} color="#333" />
            </TouchableOpacity>

            {step === "chooseType" && (
              <>
                <Text style={styles.popupHeading}>Delivery or Collection?</Text>

                <TouchableOpacity
                  style={[styles.optionButton, styles.shadowLift]}
                  onPress={() => {
                    setCollectionType("delivery");
                    setStep("deliveryMessage");
                  }}
                >
                  <Ionicons name="bicycle" size={30} color="#007bff" />
                  <Text style={styles.optionText}>Delivery</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.optionButton, styles.shadowLift]}
                  onPress={() => {
                    setCollectionType("collection");
                    setStep("chooseCollectionMethod");
                  }}
                >
                  <Ionicons name="storefront" size={32} color="#2ecc71" />
                  <Text style={styles.optionText}>Collection</Text>
                </TouchableOpacity>
              </>
            )}

            {step === "deliveryMessage" && (
              <>
                <Text style={styles.popupHeading}>Delivery</Text>
                <Text style={styles.confirmationText}>Currently we are not offering delivery.</Text>

                <TouchableOpacity style={[styles.primaryBtn, { marginTop: 20 }]} onPress={() => setStep("chooseType")}>
                  <Text style={styles.primaryBtnText}>Change Method</Text>
                </TouchableOpacity>
              </>
            )}

            {step === "chooseCollectionMethod" && (
              <>
                <Text style={styles.popupHeading}>Select Collection Method</Text>

                <TouchableOpacity
                  style={[styles.optionButton, styles.shadowLift]}
                  onPress={() => {
                    setMethod("kerbside");
                    setStep("kerbsideForm");
                  }}
                >
                  <Ionicons name="car" size={32} color="#007bff" />
                  <Text style={styles.optionText}>Kerbside</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.optionButton, styles.shadowLift]}
                  onPress={() => {
                    setMethod("instore");
                    setStep("confirmation");
                  }}
                >
                  <Ionicons name="walk" size={32} color="#2ecc71" />
                  <Text style={styles.optionText}>In-Store</Text>
                </TouchableOpacity>
              </>
            )}

            {step === "kerbsideForm" && (
              <>
                <Text style={styles.popupHeading}>Kerbside Pickup Details</Text>

                <TextInput
                  style={[styles.input, !carMake && showValidationError ? styles.inputError : null]}
                  placeholder="Car Make"
                  value={carMake}
                  onChangeText={setCarMake}
                />
                {!carMake && showValidationError && <Text style={styles.errorText}>Car Make is required</Text>}

                <TextInput
                  style={[styles.input, !carColor && showValidationError ? styles.inputError : null]}
                  placeholder="Car Colour"
                  value={carColor}
                  onChangeText={setCarColor}
                />
                {!carColor && showValidationError && <Text style={styles.errorText}>Car Colour is required</Text>}

                <TextInput
                  style={[styles.input, !carReg && showValidationError ? styles.inputError : null]}
                  placeholder="Reg Number"
                  value={carReg}
                  onChangeText={setCarReg}
                />
                {!carReg && showValidationError && <Text style={styles.errorText}>Reg Number is required</Text>}

                <View style={styles.row}>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => {
                      setShowValidationError(false);
                      setStep("chooseCollectionMethod");
                    }}
                  >
                    <Text style={styles.secondaryBtnText}>Change Method</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => {
                      if (carMake && carColor && carReg) {
                        setShowValidationError(false);
                        setStep("confirmation");
                      } else {
                        setShowValidationError(true);
                      }
                    }}
                  >
                    <Text style={styles.primaryBtnText}>Continue</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {step === "confirmation" && (
              <>
                <Ionicons name="checkmark-circle" size={70} color="#2ecc71" style={{ marginVertical: 10 }} />

                <Text style={styles.popupHeading}>Details Received!</Text>

                <Text style={styles.confirmationText}>
                  {method === "instore" ? "In-Store Collection Selected" : "Kerbside Pickup Selected"}
                </Text>

                {method === "kerbside" && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.detailLine}>Make: {carMake}</Text>
                    <Text style={styles.detailLine}>Colour: {carColor}</Text>
                    <Text style={styles.detailLine}>Reg: {carReg}</Text>
                  </View>
                )}

                <TouchableOpacity style={[styles.primaryBtn, { marginTop: 20 }]} onPress={() => setPopupVisible(false)}>
                  <Text style={styles.primaryBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </View>
      )}

      <AppHeader user={user} navigation={navigation} />

      {/* OFFERS — HORIZONTAL SCROLLER with parallax translateY on the block */}
      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <Animated.View
          style={[
            styles.horizontalOffersWrap,
            {
              transform: [
                {
                  translateY: scrollY.interpolate({
                    inputRange: [0, 220],
                    outputRange: [0, -50], // parallax up effect
                    extrapolate: "clamp",
                  }),
                },
              ],
            },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.offersScrollContent}
            decelerationRate="fast"
            snapToAlignment="center"
            snapToInterval={width * 0.76 + 16} // approximate snap (card width + margin)
          >
            {offers.map((o, idx) => (
              <LinearGradient
                key={o.id}
                colors={["#1e3a2b", "#26644b"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.offerCardHorizontal, idx === 0 ? { marginLeft: 15 } : null]}
              >
                <View style={styles.offerCardTop}>
                  <View style={styles.offerIconWrap}>
                    <Ionicons name={o.icon} size={26} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.offerTitleText}>{o.title}</Text>
                    <Text style={styles.offerSubtitleText}>{o.subtitle}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.offerCTA}
                  activeOpacity={0.85}
                  onPress={() => {
                    // placeholder action when tapping an offer
                    // you can replace with navigation or modal
                    setShowRestaurantPopup(true);
                  }}
                >
                  <Text style={styles.offerCTAText}>Claim</Text>
                </TouchableOpacity>
              </LinearGradient>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.viewDetailsBtn} onPress={() => setShowRestaurantPopup(true)}>
            <Text style={styles.viewDetailsBtnText}>View Restaurant Details</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* SEARCH BAR */}
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

        {/* CATEGORY GRID */}
        {loading ? (
          <ActivityIndicator size="large" color="#000" style={{ marginTop: 30 }} />
        ) : (
          <FlatList
            data={filteredCategories}
            renderItem={renderCategory}
            numColumns={2}
            keyExtractor={(item) => (item?.id ?? Math.random()).toString()}
            contentContainerStyle={styles.grid}
            scrollEnabled={false} // outer Animated.ScrollView handles scroll
            showsVerticalScrollIndicator={false}
          />
        )}
      </Animated.ScrollView>

      {/* RESTAURANT DETAILS CENTER POPUP */}
      {showRestaurantPopup && (
        <View style={[styles.centerOverlay, { zIndex: 1000 }]}>
          <View style={styles.centerPopup}>
            <TouchableOpacity style={styles.centerClose} onPress={() => setShowRestaurantPopup(false)}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>

            <View style={styles.centerTop}>
              <View style={styles.avatarWrap}>
                <Image
                  source={user?.restaurant_photo ? { uri: user.restaurant_photo } : require("../../assets/restaurant.png")}
                  style={styles.restaurantPopupImg}
                />
              </View>

              <Text style={styles.centerTitle}>{user?.restaurant_name || "Restaurant Name"}</Text>
              <Text style={styles.centerSubtitle}>{user?.restaurant_address || "Restaurant Address"}</Text>
              <Text style={styles.centerPhone}>📞 {user?.restaurant_phonenumber || "Phone Number"}</Text>
            </View>

            <View style={styles.centerActions}>
              <TouchableOpacity
                style={styles.centerBtn}
                onPress={() => {
                  setShowRestaurantPopup(false);
                  navigation.navigate("RestaurantTimings", { userId });
                }}
              >
                <Text style={styles.centerBtnText}>View Timings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.centerBtn, styles.centerBtnAlt]} onPress={() => setShowRestaurantPopup(false)}>
                <Text style={[styles.centerBtnText, { color: "#071029" }]}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <BottomBar navigation={navigation} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },

  /* original popup styles */
  inputError: {
    borderColor: "red",
    borderWidth: 1.5,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    alignSelf: "flex-start",
    marginBottom: 6,
    marginLeft: 4,
  },
  popupOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 60,
    zIndex: 999,
  },
  popupCard: {
    width: "88%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 22,
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    alignItems: "center",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    right: 15,
    top: 15,
    padding: 5,
  },
  popupHeading: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    marginBottom: 20,
    textAlign: "center",
  },
  optionButton: {
    width: "100%",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
    backgroundColor: "#fff",
  },
  optionText: {
    marginLeft: 12,
    fontSize: 17,
    color: "#333",
    fontWeight: "600",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 10,
    marginVertical: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  primaryBtn: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  secondaryBtn: {
    backgroundColor: "#ddd",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  confirmationText: {
    fontSize: 16,
    color: "#444",
    marginTop: 5,
    textAlign: "center",
  },
  detailLine: {
    fontSize: 15,
    color: "#444",
    marginTop: 4,
  },

  /* HORIZONTAL OFFERS (NEW) */
  horizontalOffersWrap: {
    marginTop: 12,
  },
  offersScrollContent: {
    paddingRight: 24,
    alignItems: "center",
  },
  offerCardHorizontal: {
    width: Math.round(width * 0.76),
    marginRight: 16,
    borderRadius: 16,
    padding: 18,
    justifyContent: "space-between",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  offerCardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  offerIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  offerTitleText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 4,
  },
  offerSubtitleText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
  },
  offerCTA: {
    marginTop: 14,
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  offerCTAText: {
    fontWeight: "800",
    color: "#1b1b1b",
  },

  viewDetailsBtn: {
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 6,
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  viewDetailsBtnText: {
    color: "#071029",
    fontWeight: "800",
  },

  /* CENTERED RESTAURANT POPUP (GLASS EFFECT) */
  centerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(4,8,15,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  centerPopup: {
    width: "88%",
    borderRadius: 18,
    padding: 18,
    backgroundColor: "white",
  },
  centerClose: {
    position: "absolute",
    right: 12,
    top: -40,
    zIndex: 2,
    backgroundColor: "rgba(8, 7, 7, 0.06)",
    padding: 6,
    borderRadius: 8,
  },
  centerTop: {
    alignItems: "center",
    marginTop: 6,
    paddingHorizontal: 6,
  },
  avatarWrap: {
    borderRadius: 14,
    padding: 6,
    backgroundColor: "rgba(255,255,255,0.03)",
    marginBottom: 8,
  },
  restaurantPopupImg: {
    width: 110,
    height: 110,
    borderRadius: 14,
    backgroundColor: "#f2f2f2",
  },
  centerTitle: {
    color: "#0d0a0a",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 10,
  },
  centerSubtitle: {
    color: "#111212ff",
    textAlign: "center",
    marginTop: 6,
    fontSize: 13,
  },
  centerPhone: {
    color: "#0f1010ff",
    marginTop: 8,
    fontWeight: "700",
  },
  centerActions: {
    flexDirection: "row",
    marginTop: 16,
    width: "100%",
    justifyContent: "space-between",
  },
  centerBtn: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#a7f3d0",
    alignItems: "center",
    justifyContent: "center",
  },
  centerBtnAlt: {
    backgroundColor: "#fff",
  },
  centerBtnText: {
    fontWeight: "900",
    color: "#071029",
  },

  /* SEARCH & GRID */
  searchWrapper: {
    marginTop: 14,
    marginHorizontal: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    elevation: 3,
    height: 50,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#333",
  },

  grid: {
    paddingHorizontal: 10,
    paddingBottom: 60,
  },
  categoryCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    margin: 10,
    width: ITEM_WIDTH,
    alignItems: "center",
    elevation: 4,
    padding: 12,
  },
  categoryImage: {
    width: ITEM_WIDTH - 20,
    height: ITEM_WIDTH - 20,
    borderRadius: 12,
  },
  categoryText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  /* small util */
  shadowLift: {
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
