import React, { useEffect, useState } from "react";
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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppHeader from "../AppHeader";
import { fetchCategories } from "../../services/categoryService";
import Ionicons from "react-native-vector-icons/Ionicons";
import BottomBar from "../BottomBar";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 50) / 2;

export default function Categories({ route, navigation }) {
  const { userId } = route.params;

  const [user, setUser] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Popup states
  const [popupVisible, setPopupVisible] = useState(true);
  const [step, setStep] = useState("chooseType"); 
  const [collectionType, setCollectionType] = useState(null);
  const [method, setMethod] = useState(null);

  const [carMake, setCarMake] = useState("");
  const [carColor, setCarColor] = useState("");
  const [carReg, setCarReg] = useState("");
  const [showValidationError, setShowValidationError] = useState(false);
  // Animation for popup
  const popupAnim = useState(new Animated.Value(-500))[0];

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    };
    loadUser();
  }, []);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (popupVisible) {
      Animated.spring(popupAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 8,
      }).start();
    }
  }, [popupVisible]);

  const loadCategories = async () => {
    try {
      const data = await fetchCategories(userId);
      setCategories(data);
    } catch (error) {
      console.log("Category Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    (cat?.name || "").toLowerCase().includes(searchText.toLowerCase())
  );

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      activeOpacity={0.8}
      onPress={() =>
        navigation.navigate("Products", {
          userId: userId,
          categoryId: item.id,
        })
      }
    >
      <Image
        source={
          item.image ? { uri: item.image } : require("../../assets/restaurant.png")
        }
        style={styles.categoryImage}
      />
      <Text style={styles.categoryText} numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* ---------------- POPUP ---------------- */}
      {popupVisible && (
        <View style={styles.popupOverlay}>
          <Animated.View
            style={[
              styles.popupCard,
              { transform: [{ translateY: popupAnim }] },
            ]}
          >
            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setPopupVisible(false)}
            >
              <Ionicons name="close" size={26} color="#333" />
            </TouchableOpacity>

            {/* STEP 1 — Delivery or Collection */}
            {step === "chooseType" && (
              <>
                <Text style={styles.popupHeading}>Delivery or Collection?</Text>

                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => {
                    setCollectionType("delivery");
                    setStep("deliveryMessage");
                  }}
                >
                  <Ionicons name="bicycle" size={30} color="#007bff" />
                  <Text style={styles.optionText}>Delivery</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.optionButton}
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

            {/* STEP 2 — Delivery Message */}
            {step === "deliveryMessage" && (
              <>
                <Text style={styles.popupHeading}>Delivery</Text>
                <Text style={styles.confirmationText}>
                  Currently we are not offering delivery.
                </Text>

                <TouchableOpacity
                  style={[styles.primaryBtn, { marginTop: 20 }]}
                  onPress={() => setStep("chooseType")}
                >
                  <Text style={styles.primaryBtnText}>Change Method</Text>
                </TouchableOpacity>
              </>
            )}

            {/* STEP 3 — Select Collection Method */}
            {step === "chooseCollectionMethod" && (
              <>
                <Text style={styles.popupHeading}>Select Collection Method</Text>

                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => {
                    setMethod("kerbside");
                    setStep("kerbsideForm");
                  }}
                >
                  <Ionicons name="car" size={32} color="#007bff" />
                  <Text style={styles.optionText}>Kerbside</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.optionButton}
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

            {/* STEP 4 — Kerbside Form */}
{step === "kerbsideForm" && (
  <>
    <Text style={styles.popupHeading}>Kerbside Pickup Details</Text>

    <TextInput
      style={[
        styles.input,
        !carMake && showValidationError ? styles.inputError : null,
      ]}
      placeholder="Car Make"
      value={carMake}
      onChangeText={setCarMake}
    />
    {!carMake && showValidationError && (
      <Text style={styles.errorText}>Car Make is required</Text>
    )}

    <TextInput
      style={[
        styles.input,
        !carColor && showValidationError ? styles.inputError : null,
      ]}
      placeholder="Car Colour"
      value={carColor}
      onChangeText={setCarColor}
    />
    {!carColor && showValidationError && (
      <Text style={styles.errorText}>Car Colour is required</Text>
    )}

    <TextInput
      style={[
        styles.input,
        !carReg && showValidationError ? styles.inputError : null,
      ]}
      placeholder="Reg Number"
      value={carReg}
      onChangeText={setCarReg}
    />
    {!carReg && showValidationError && (
      <Text style={styles.errorText}>Reg Number is required</Text>
    )}

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

            {/* STEP 5 — Confirmation */}
            {step === "confirmation" && (
              <>
                <Ionicons
                  name="checkmark-circle"
                  size={70}
                  color="#2ecc71"
                  style={{ marginVertical: 10 }}
                />

                <Text style={styles.popupHeading}>Details Received!</Text>

                <Text style={styles.confirmationText}>
                  {method === "instore"
                    ? "In-Store Collection Selected"
                    : "Kerbside Pickup Selected"}
                </Text>

                {method === "kerbside" && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.detailLine}>Make: {carMake}</Text>
                    <Text style={styles.detailLine}>Colour: {carColor}</Text>
                    <Text style={styles.detailLine}>Reg: {carReg}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.primaryBtn, { marginTop: 20 }]}
                  onPress={() => setPopupVisible(false)}
                >
                  <Text style={styles.primaryBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </View>
      )}

      {/* ---------------- ACTUAL SCREEN ---------------- */}
      <AppHeader user={user} navigation={navigation} />

      {/* Restaurant Card */}
      <View style={styles.restaurantCard}>
        <Image
          source={
            user?.restaurant_photo
              ? { uri: user.restaurant_photo }
              : require("../../assets/restaurant.png")
          }
          style={styles.restaurantImage}
        />

        <View style={styles.restaurantContent}>
          <Text style={styles.restaurantName}>
            {user?.restaurant_name || "Restaurant Name"}
          </Text>

          <Text style={styles.restaurantAddress} numberOfLines={2}>
            {user?.restaurant_address || "Restaurant Address"}
          </Text>

          <View style={styles.rowBetween}>
            <Text style={styles.restaurantPhone}>
              📞 {user?.restaurant_phonenumber || "Phone Number"}
            </Text>
            <View style={styles.vegBadge}>
              <Text style={styles.vegBadgeText}>100% Pure Veg</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.timingButton}
            onPress={() => navigation.navigate("RestaurantTimings", { userId })}
          >
            <Text style={styles.timingButtonText}>Regular Timings of Resturent</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />

        <TextInput
          style={styles.searchInput}
          placeholder="Search categories..."
          placeholderTextColor="#888"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={filteredCategories}
          renderItem={renderCategory}
          numColumns={2}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />
      )}

      <BottomBar navigation={navigation} />
    </View>
  );
}

// ---------------- STYLES ----------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },

  /* Popup Styles */
  inputError: {
  borderColor: 'red',
  borderWidth: 1.5,
},
errorText: {
  color: 'red',
  fontSize: 12,
  alignSelf: 'flex-start',
  marginBottom: 6,
  marginLeft: 4,
},

  popupOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 60,
    zIndex: 999,
  },
  popupCard: {
    width: "88%",
    backgroundColor: "#fff",
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
    borderColor: "#ddd",
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
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

  /* Restaurant Card */
  restaurantCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    marginHorizontal: 15,
    marginTop: 15,
    padding: 14,
    borderRadius: 18,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  restaurantImage: {
    width: 95,
    height: 95,
    borderRadius: 16,
    backgroundColor: "#f2f2f2",
  },
  restaurantContent: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "center",
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1c1c1c",
  },
  restaurantAddress: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
    lineHeight: 18,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  restaurantPhone: {
    fontSize: 14,
    color: "#444",
    fontWeight: "500",
  },
  vegBadge: {
    backgroundColor: "#2ecc71",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
  },
  vegBadgeText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },
  timingButton: {
    marginTop: 12,
    backgroundColor: "#4cb655ff",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  timingButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  /* Search Bar */
  searchWrapper: {
    marginTop: 10,
    marginHorizontal: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    elevation: 3,
    height: 50,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },

  /* Category Grid */
  grid: {
    paddingTop: 10,
    paddingBottom: 40,
    paddingHorizontal: 10,
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
});
