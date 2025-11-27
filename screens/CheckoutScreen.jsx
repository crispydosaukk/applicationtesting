// CheckoutScreen.js
import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";

import AppHeader from "./AppHeader";
import BottomBar from "./BottomBar";
import MenuModal from "./MenuModal";

import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import { getCart } from "../services/cartService";
import { createOrder } from "../services/orderService";

const CheckoutScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);

  // Popups
  const [deliveryPopup, setDeliveryPopup] = useState(true);
  const [allergyPopup, setAllergyPopup] = useState(false);

  // Delivery details
  const [deliveryMethod, setDeliveryMethod] = useState(null);
  const [kerbsideName, setKerbsideName] = useState("");
  const [kerbsideColor, setKerbsideColor] = useState("");
  const [kerbsideReg, setKerbsideReg] = useState("");

  // Allergy
  const [allergyNote, setAllergyNote] = useState("");

  // Success popup
  const [orderPlaced, setOrderPlaced] = useState(false);

  const [menuVisible, setMenuVisible] = useState(false);

  const isFocused = useIsFocused();

  // Cart map for header icon
  const cartItemsMap = useMemo(() => {
    const map = {};
    cart.forEach((item) => {
      const qty = item.product_quantity || 0;
      if (qty > 0) map[item.product_id] = qty;
    });
    return map;
  }, [cart]);

  // Load user
  useEffect(() => {
    const loadUser = async () => {
      const stored = await AsyncStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    };
    loadUser();
  }, []);

  // Load cart from server
  useEffect(() => {
    if (!user || !isFocused) return;

    const fetchServerCart = async () => {
      const customerId = user.id ?? user.customer_id;
      if (!customerId) return;

      const res = await getCart(customerId);
      if (res && res.status === 1 && Array.isArray(res.data)) {
        setCart(res.data);
      }
    };

    fetchServerCart();
  }, [user, isFocused]);

  // Calculate total
  const calculateTotal = () =>
    cart
      .reduce((sum, item) => {
        const price = Number(item.discount_price ?? item.product_price);
        return sum + price * (item.product_quantity || 0);
      }, 0)
      .toFixed(2);

  // Continue after choosing delivery
  const continueDeliverySelection = () => {
    if (!deliveryMethod) {
      alert("Please select Kerbside or In-store.");
      return;
    }

    if (
      deliveryMethod === "kerbside" &&
      (!kerbsideName || !kerbsideColor || !kerbsideReg)
    ) {
      alert("All kerbside fields are required.");
      return;
    }

    setDeliveryPopup(false);
    setAllergyPopup(true);
  };

  // Place order
  const placeOrder = async () => {
    if (!user) return;

    const customerId = user.customer_id || user.id;

    const orderData = {
      user_id: user.id,
      customer_id: customerId,
      payment_mode: 0,
      razorpay_payment_requestid: null,
      instore: deliveryMethod === "instore" ? 1 : 0,
      allergy_note: allergyNote,
      car_color: kerbsideColor,
      reg_number: kerbsideReg,
      owner_name: kerbsideName,
      mobile_number: user.mobile_number || null,

      items: cart.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        textfield: item.textfield || "", // ADD NOTE TO ORDER
        price: item.product_price,
        discount_amount: item.discount_price
          ? item.product_price - item.discount_price
          : 0,
        vat: 0,
        quantity: item.product_quantity,
      })),
    };

    const res = await createOrder(orderData);

    if (res.status === 1) {
      setOrderPlaced(true);
      setTimeout(() => {
        setOrderPlaced(false);
        navigation.navigate("Home");
      }, 2000);
    } else {
      alert(res.message || "Order failed");
    }
  };

  // DELIVERY + ALLERGY SUMMARY UI
  const renderDeliverySummary = () => (
    <View style={styles.deliverySummaryBox}>
      <Text style={styles.summaryLine}>
        <Text style={styles.summaryBold}>Delivery Method: </Text>
        {deliveryMethod === "kerbside" ? "Kerbside Pickup" : "In-store Pickup"}
      </Text>

      {deliveryMethod === "kerbside" && (
        <>
          <Text style={styles.summaryLine}>
            <Text style={styles.summaryBold}>Name: </Text>
            {kerbsideName}
          </Text>
          <Text style={styles.summaryLine}>
            <Text style={styles.summaryBold}>Car Colour: </Text>
            {kerbsideColor}
          </Text>
          <Text style={styles.summaryLine}>
            <Text style={styles.summaryBold}>Reg Number: </Text>
            {kerbsideReg}
          </Text>
        </>
      )}

      {allergyNote ? (
        <Text style={styles.summaryLine}>
          <Text style={styles.summaryBold}>Allergy Note: </Text>
          {allergyNote}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <AppHeader
        user={user}
        navigation={navigation}
        cartItems={cartItemsMap}
        onMenuPress={() => setMenuVisible(true)}
      />

      <FlatList
        data={cart}
        keyExtractor={(item) => item.product_id.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 200 }}
        ListHeaderComponent={
          <>
            {/* ORDER SUMMARY TOP BOX */}
            <View style={styles.summaryBox}>
              <Icon name="clipboard-list-outline" size={26} color="#28a745" />
              <Text style={styles.summaryTitle}>Order Summary</Text>
              <Text style={styles.summarySub}>
                Review your items before placing the order.
              </Text>
            </View>

            {/* NEW DELIVERY DETAILS SUMMARY */}
            {(!deliveryPopup && !allergyPopup) && renderDeliverySummary()}
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.product_name}</Text>

              {/* SHOW PRODUCT NOTE */}
              {item.textfield ? (
                <Text style={styles.itemNote}>Note: {item.textfield}</Text>
              ) : null}

              <Text style={styles.itemQty}>
                {item.product_quantity} × £
                {Number(item.discount_price ?? item.product_price).toFixed(2)}
              </Text>
            </View>

            <Text style={styles.itemPrice}>
              £
              {(
                Number(item.discount_price ?? item.product_price) *
                item.product_quantity
              ).toFixed(2)}
            </Text>
          </View>
        )}
      />

      {/* TOTAL + CTA */}
      <View style={styles.bottomContainer}>
        <View style={styles.totalRow}>
          <Icon name="cash-multiple" size={26} color="#28a745" />
          <Text style={styles.totalLabel}>Grand Total</Text>
          <Text style={styles.totalAmount}>£{calculateTotal()}</Text>
        </View>

        {!deliveryPopup && !allergyPopup && (
          <TouchableOpacity style={styles.placeOrderButton} onPress={placeOrder}>
            <Icon name="check-circle-outline" size={24} color="#fff" />
            <Text style={styles.placeOrderText}>Place Order</Text>
          </TouchableOpacity>
        )}
      </View>

      <MenuModal
        visible={menuVisible}
        setVisible={setMenuVisible}
        user={user}
        navigation={navigation}
      />

      <BottomBar navigation={navigation} />

      {/* DELIVERY POPUP */}
      <Modal visible={deliveryPopup} transparent animationType="fade">
        <View style={styles.popupContainer}>
          <View style={styles.popupBox}>
            <Icon name="truck-outline" size={40} color="#28a745" style={{ alignSelf: "center" }} />
            <Text style={styles.popupTitle}>Choose Delivery Method</Text>

            <TouchableOpacity
              style={[
                styles.methodBox,
                deliveryMethod === "kerbside" && styles.methodSelected,
              ]}
              onPress={() => setDeliveryMethod("kerbside")}
            >
              <Icon name="car-outline" size={24} color="#333" />
              <Text style={styles.methodText}>Kerbside Pickup</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.methodBox,
                deliveryMethod === "instore" && styles.methodSelected,
              ]}
              onPress={() => setDeliveryMethod("instore")}
            >
              <Icon name="storefront-outline" size={24} color="#333" />
              <Text style={styles.methodText}>In-store Pickup</Text>
            </TouchableOpacity>

            {deliveryMethod === "kerbside" && (
              <View style={styles.inputArea}>
                <TextInput
                  placeholder="Your Name"
                  style={styles.input}
                  value={kerbsideName}
                  onChangeText={setKerbsideName}
                />
                <TextInput
                  placeholder="Car Colour"
                  style={styles.input}
                  value={kerbsideColor}
                  onChangeText={setKerbsideColor}
                />
                <TextInput
                  placeholder="Car Reg Number"
                  style={styles.input}
                  value={kerbsideReg}
                  onChangeText={setKerbsideReg}
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={continueDeliverySelection}
            >
              <Text style={styles.primaryText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ALLERGY POPUP */}
      <Modal visible={allergyPopup} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.popupContainer}
        >
          <View style={styles.popupBox}>
            <Icon
              name="alert-circle-outline"
              size={40}
              color="#ff6f00"
              style={{ alignSelf: "center" }}
            />
            <Text style={styles.popupTitle}>
              Any allergies or dietary requirements?
            </Text>
            <Text style={styles.allergyWarning}>
              If you have any allergy that could affect your health, we strongly
              advise you to contact the restaurant directly on the provided phone
              number before placing your order.
            </Text>

            <TextInput
              style={[styles.input, { minHeight: 80 }]}
              placeholder="Add your note (optional)"
              value={allergyNote}
              multiline
              onChangeText={setAllergyNote}
            />

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setAllergyPopup(false)}
            >
              <Text style={styles.primaryText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* SUCCESS POPUP */}
      <Modal visible={orderPlaced} transparent animationType="fade">
        <View style={styles.orderSuccessContainer}>
          <View style={styles.successBox}>
            <Icon name="check-decagram" size={50} color="#28a745" />
            <Text style={styles.successText}>Order Placed Successfully!</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CheckoutScreen;

// STYLES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  summaryBox: {
    padding: 16,
    borderRadius: 5,
    backgroundColor: "#e8f5e9",
    marginBottom: 20,
  },
  summaryTitle: { fontSize: 20, fontWeight: "700", marginTop: 10 },
  summarySub: { color: "#444", marginTop: 4 },

  deliverySummaryBox: {
    padding: 14,
    backgroundColor: "#f1f8e9",
    borderRadius: 5,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#28a745",
  },
  summaryLine: {
    fontSize: 15,
    marginBottom: 4,
    color: "#333",
  },
  summaryBold: {
    fontWeight: "700",
    color: "#111",
  },

  allergyWarning: {
  fontSize: 14,
  color: "#555",
  marginBottom: 12,
  marginTop: -4,
  lineHeight: 20,
  textAlign: "center",
},

  itemCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    elevation: 2,
  },
  itemName: { fontSize: 16, fontWeight: "700" },

  itemNote: {
    marginTop: 4,
    color: "#ff6f00",
    fontStyle: "italic",
  },

  itemQty: { marginTop: 4, color: "#555" },
  itemPrice: { fontSize: 16, fontWeight: "700", color: "#28a745" },

  bottomContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#eee",
    position: "absolute",
    bottom: 70,
    width: "100%",
  },

  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  totalLabel: { fontSize: 18, fontWeight: "700", marginLeft: 10 },
  totalAmount: { fontSize: 22, fontWeight: "800", color: "#28a745" },

  placeOrderButton: {
    backgroundColor: "#28a745",
    padding: 16,
    borderRadius: 5,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  placeOrderText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginLeft: 8,
  },

  popupContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  popupBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 5,
    width: "90%",
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 12,
  },

  methodBox: {
    padding: 14,
    backgroundColor: "#f4f4f4",
    borderRadius: 5,
    marginVertical: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  methodSelected: {
    backgroundColor: "#c8e6c9",
    borderColor: "#28a745",
    borderWidth: 1,
  },
  methodText: { marginLeft: 12, fontSize: 16, fontWeight: "600" },

  inputArea: { marginTop: 12 },

  input: {
    padding: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 12,
  },

  primaryButton: {
    backgroundColor: "#28a745",
    padding: 14,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  orderSuccessContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  successBox: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 5,
    alignItems: "center",
  },
  successText: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "800",
    color: "#28a745",
  },
});
