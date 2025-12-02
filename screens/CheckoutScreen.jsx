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
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useIsFocused } from "@react-navigation/native";

import AppHeader from "./AppHeader";
import BottomBar from "./BottomBar";
import MenuModal from "./MenuModal";
import { getCart } from "../services/cartService";
import { createOrder } from "../services/orderService";

export default function CheckoutScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);

  const [deliveryPopup, setDeliveryPopup] = useState(true);
  const [allergyPopup, setAllergyPopup] = useState(false);

  const [deliveryMethod, setDeliveryMethod] = useState(null);
  const [kerbsideName, setKerbsideName] = useState("");
  const [kerbsideColor, setKerbsideColor] = useState("");
  const [kerbsideReg, setKerbsideReg] = useState("");
  const [allergyNote, setAllergyNote] = useState("");

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const isFocused = useIsFocused();

  // map for cart badge in header
  const cartItemsMap = useMemo(() => {
    const map = {};
    cart.forEach((item) => {
      const qty = item.product_quantity || 0;
      if (qty > 0) map[item.product_id] = qty;
    });
    return map;
  }, [cart]);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    })();
  }, []);

  useEffect(() => {
    if (!user || !isFocused) return;
    (async () => {
      const cid = user.id ?? user.customer_id;
      const res = await getCart(cid);
      if (res?.status === 1) setCart(res.data || []);
    })();
  }, [user, isFocused]);

  const calculateTotal = () =>
    cart
      .reduce((sum, item) => {
        const p = Number(item.discount_price ?? item.product_price ?? 0);
        return sum + p * (item.product_quantity || 0);
      }, 0)
      .toFixed(2);

  const continueDeliverySelection = () => {
    if (!deliveryMethod) {
      alert("Please select a delivery method.");
      return;
    }

    if (
      deliveryMethod === "kerbside" &&
      (!kerbsideName || !kerbsideColor || !kerbsideReg)
    ) {
      alert("Please fill all kerbside details.");
      return;
    }

    setDeliveryPopup(false);
    setAllergyPopup(true);
  };

  const placeOrder = async () => {
    if (!user) return;

    const cid = user.customer_id ?? user.id;

    const payload = {
      user_id: user.id,
      customer_id: cid,
      payment_mode: 0,
      instore: deliveryMethod === "instore" ? 1 : 0,
      allergy_note: allergyNote,
      car_color: kerbsideColor,
      reg_number: kerbsideReg,
      owner_name: kerbsideName,
      mobile_number: user.mobile_number || "",
      items: cart.map((i) => ({
        product_id: i.product_id,
        product_name: i.product_name,
        textfield: i.textfield || "",
        price: i.product_price,
        discount_amount: i.discount_price
          ? i.product_price - i.discount_price
          : 0,
        vat: 0,
        quantity: i.product_quantity,
      })),
    };

    const res = await createOrder(payload);
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

  const renderDeliverySummary = () => (
    <View style={styles.deliverySummaryBox}>
      <Text style={styles.summaryText}>
        <Text style={styles.bold}>Delivery Method: </Text>
        {deliveryMethod === "kerbside" ? "Kerbside Pickup" : "In-store Pickup"}
      </Text>

      {deliveryMethod === "kerbside" && (
        <>
          <Text style={styles.summaryText}>
            <Text style={styles.bold}>Name: </Text>
            {kerbsideName}
          </Text>
          <Text style={styles.summaryText}>
            <Text style={styles.bold}>Car Colour: </Text>
            {kerbsideColor}
          </Text>
          <Text style={styles.summaryText}>
            <Text style={styles.bold}>Reg Number: </Text>
            {kerbsideReg}
          </Text>
        </>
      )}

      {allergyNote ? (
        <Text style={styles.summaryText}>
          <Text style={styles.bold}>Allergy Note: </Text>
          {allergyNote}
        </Text>
      ) : null}
    </View>
  );

  return (
    // 🔧 no extra top/bottom padding; AppHeader & BottomBar handle it
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <AppHeader
        user={user}
        navigation={navigation}
        cartItems={cartItemsMap}
        onMenuPress={() => setMenuVisible(true)}
      />

      <FlatList
        data={cart}
        keyExtractor={(i) => i.product_id.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 200 }}
        ListHeaderComponent={
          <>
            <View style={styles.summaryBox}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Icon
                  name="clipboard-list-outline"
                  size={26}
                  color="#28a745"
                />
                <Text style={styles.summaryTitle}>Order Summary</Text>
              </View>
              <Text style={styles.summarySub}>
                Review your items before placing the order.
              </Text>
            </View>

            {!deliveryPopup && !allergyPopup && renderDeliverySummary()}
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.product_name}</Text>
              {item.textfield ? (
                <Text style={styles.itemNote}>Note: {item.textfield}</Text>
              ) : null}
              <Text style={styles.itemQty}>
                {item.product_quantity} × £
                {Number(
                  item.discount_price ?? item.product_price ?? 0
                ).toFixed(2)}
              </Text>
            </View>
            <Text style={styles.itemPrice}>
              £
              {(
                Number(item.discount_price ?? item.product_price ?? 0) *
                item.product_quantity
              ).toFixed(2)}
            </Text>
          </View>
        )}
      />

      {/* FLOATING BAR – stays above bottom bar */}
      {!deliveryPopup && !allergyPopup && (
        <View style={styles.floatingBar}>
          <View>
            <Text style={styles.floatLabel}>Grand Total</Text>
            <Text style={styles.floatAmount}>£{calculateTotal()}</Text>
          </View>
          <TouchableOpacity style={styles.floatBtn} onPress={placeOrder}>
            <Text style={styles.floatBtnText}>Place Order</Text>
            <Icon name="chevron-right" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      <MenuModal
        visible={menuVisible}
        setVisible={setMenuVisible}
        user={user}
        navigation={navigation}
      />
      <BottomBar navigation={navigation} />

      {/* DELIVERY POPUP */}
      <Modal visible={deliveryPopup} transparent animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popupBox}>
            {/* Back button */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <Icon name="arrow-left" size={22} color="#333" />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>

            <Icon
              name="truck-outline"
              size={40}
              color="#28a745"
              style={styles.popupIcon}
            />
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
                  style={styles.input}
                  placeholder="Your Name"
                  value={kerbsideName}
                  onChangeText={setKerbsideName}
                  placeholderTextColor="#777777"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Car Colour"
                  value={kerbsideColor}
                  onChangeText={setKerbsideColor}
                  placeholderTextColor="#777777"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Car Reg Number"
                  value={kerbsideReg}
                  onChangeText={setKerbsideReg}
                  placeholderTextColor="#777777"
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.primaryBtn}
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
          style={styles.popupOverlay}
        >
          <View style={styles.popupBox}>
            {/* Back button */}
            <TouchableOpacity
              onPress={() => {
                setAllergyPopup(false);
                setDeliveryPopup(true);
              }}
              style={styles.backBtn}
            >
              <Icon name="arrow-left" size={22} color="#333" />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>

            <Icon
              name="alert-circle-outline"
              size={40}
              color="#ff6f00"
              style={styles.popupIcon}
            />

            <Text style={styles.popupTitle}>
              Any allergies or requirements?
            </Text>

            {/* Dummy restaurant number */}
            <Text style={styles.allergyWarning}>
              For allergy concerns, please contact the restaurant at{" "}
              <Text style={{ fontWeight: "700" }}>020 7946 0999</Text>.
            </Text>

            <TextInput
              style={[styles.input, { minHeight: 80 }]}
              placeholder="Add your note (optional)"
              value={allergyNote}
              onChangeText={setAllergyNote}
              multiline
              placeholderTextColor="#777777"
            />

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setAllergyPopup(false)}
            >
              <Text style={styles.primaryText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* SUCCESS POPUP */}
      <Modal visible={orderPlaced} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successBox}>
            <Icon name="check-decagram" size={50} color="#28a745" />
            <Text style={styles.successText}>
              Order Placed Successfully!
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  summaryBox: {
    padding: 16,
    borderRadius: 5,
    backgroundColor: "#e8f5e9",
    marginBottom: 16,
  },
  summaryTitle: { fontSize: 18, fontWeight: "700", color: "#222" },
  summarySub: { color: "#555", marginTop: 4, fontSize: 14 },

  deliverySummaryBox: {
    padding: 14,
    backgroundColor: "#f1f8e9",
    borderLeftWidth: 4,
    borderLeftColor: "#28a745",
    borderRadius: 5,
    marginBottom: 16,
  },
  summaryText: { fontSize: 14, marginBottom: 4, color: "#333" },
  bold: { fontWeight: "700" },

  itemCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    elevation: 3,
  },
  itemName: { fontSize: 15, fontWeight: "700", color: "#222" },
  itemNote: { marginTop: 4, fontSize: 13, color: "#ff6f00" },
  itemQty: { marginTop: 4, fontSize: 13, color: "#555" },
  itemPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#28a745",
    alignSelf: "center",
  },

  floatingBar: {
    position: "absolute",
    bottom: 80, // sits just above BottomBar
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 10,
  },
  floatLabel: { fontSize: 13, color: "#777" },
  floatAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: "#28a745",
    marginTop: 2,
  },
  floatBtn: {
    backgroundColor: "#28a745",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  floatBtnText: { color: "#fff", fontSize: 15, fontWeight: "700", marginRight: 6 },

  // POPUPS
  popupOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: 16,
  },
  popupBox: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 5,
    width: "90%",
  },
  popupIcon: { alignSelf: "center", marginBottom: 8 },

  backBtn: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  backBtnText: { marginLeft: 6, fontSize: 15, fontWeight: "700", color: "#333" },

  popupTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
    color: "#222",
  },
  allergyWarning: {
    fontSize: 13,
    color: "#444",
    textAlign: "center",
    marginBottom: 14,
    lineHeight: 18,
  },

  methodBox: {
    padding: 14,
    backgroundColor: "#f3f3f3",
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  methodSelected: {
    backgroundColor: "#c8e6c9",
    borderWidth: 1,
    borderColor: "#28a745",
  },
  methodText: { marginLeft: 12, fontSize: 15, fontWeight: "600", color: "#222" },

  inputArea: { marginTop: 10 },
  input: {
    padding: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
    fontSize: 14,
    color: "#222",
  },

  primaryBtn: {
    backgroundColor: "#28a745",
    padding: 14,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 6,
  },
  primaryText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  successOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
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
    marginTop: 10,
    fontSize: 18,
    fontWeight: "800",
    color: "#28a745",
  },
});
