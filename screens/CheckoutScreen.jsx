import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import AppHeader from "./AppHeader";
import BottomBar from "./BottomBar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCart } from "../services/cartService";
import { createOrder } from "../services/orderService";

const CheckoutScreen = ({ navigation }) => {
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

  // Load user from AsyncStorage
  useEffect(() => {
    const loadUser = async () => {
      const stored = await AsyncStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    };
    loadUser();
  }, []);

  // Fetch cart once user is loaded
  useEffect(() => {
    if (!user) return;
    const fetchServerCart = async () => {
      const customerId = user.id ?? user.customer_id;
      if (!customerId) return;

      const res = await getCart(customerId);
      if (res && res.status === 1 && Array.isArray(res.data)) setCart(res.data);
    };
    fetchServerCart();
  }, [user]);

  const calculateTotal = () =>
    cart.reduce((sum, item) => {
      const price = Number(item.discount_price ?? item.product_price);
      return sum + price * (item.product_quantity || 0);
    }, 0)
    .toFixed(2);

  const continueDeliverySelection = () => {
    if (!deliveryMethod) { alert("Please select Kerbside or In-store."); return; }
    if (deliveryMethod === "kerbside" && (!kerbsideName || !kerbsideColor || !kerbsideReg)) {
      alert("All kerbside fields are required."); return;
    }
    setDeliveryPopup(false);
    setAllergyPopup(true);
  };

  const placeOrder = async () => {
  if (!user) return;

  const customerId = user.customer_id || user.id; // fallback

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
    items: cart.map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      price: item.product_price,
      discount_amount: item.discount_price ? (item.product_price - item.discount_price) : 0,
      vat: 0,
      quantity: item.product_quantity
    }))
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


  return (
    <View style={styles.container}>
      <AppHeader user={user} navigation={navigation} cartItems={cart} />

      {!deliveryPopup && !allergyPopup && (
        <View style={styles.summaryBox}>
          <Text style={styles.sumTitle}>Order Details:</Text>
          <Text style={styles.sumText}>Delivery Method: {deliveryMethod}</Text>
          {deliveryMethod === "kerbside" && <>
            <Text style={styles.sumText}>Name: {kerbsideName}</Text>
            <Text style={styles.sumText}>Car Color: {kerbsideColor}</Text>
            <Text style={styles.sumText}>Reg No.: {kerbsideReg}</Text>
          </>}
          {allergyNote && <Text style={styles.sumText}>Allergy Note: {allergyNote}</Text>}
        </View>
      )}

      <FlatList
        data={cart}
        keyExtractor={(item) => item.product_id.toString()}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <View style={styles.itemBox}>
            <Text style={styles.itemName}>{item.product_name}</Text>
            <Text style={styles.itemPrice}>£ {Number(item.discount_price ?? item.product_price).toFixed(2)} × {item.product_quantity}</Text>
          </View>
        )}
      />

      <View style={styles.totalBox}>
        <Text style={styles.totalText}>Total: £ {calculateTotal()}</Text>
      </View>

      {!deliveryPopup && !allergyPopup && (
        <TouchableOpacity style={styles.placeOrderButton} onPress={placeOrder}>
          <Text style={styles.placeOrderText}>Place Order</Text>
        </TouchableOpacity>
      )}

      <BottomBar navigation={navigation} />

      {/* Delivery Modal */}
      <Modal visible={deliveryPopup} transparent animationType="fade">
        <View style={styles.popupContainer}>
          <View style={styles.popupBox}>
            <Text style={styles.popupTitle}>Choose Delivery Method</Text>
            <TouchableOpacity
              style={[styles.methodButton, deliveryMethod === "kerbside" && styles.selectedMethod]}
              onPress={() => setDeliveryMethod("kerbside")}
            >
              <Text style={styles.methodText}>Kerbside Pickup</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.methodButton, deliveryMethod === "instore" && styles.selectedMethod]}
              onPress={() => setDeliveryMethod("instore")}
            >
              <Text style={styles.methodText}>In-store Pickup</Text>
            </TouchableOpacity>
            {deliveryMethod === "kerbside" && <View style={styles.kerbsideFields}>
              <TextInput style={styles.input} placeholder="Full Name" value={kerbsideName} onChangeText={setKerbsideName} />
              <TextInput style={styles.input} placeholder="Car Color" value={kerbsideColor} onChangeText={setKerbsideColor} />
              <TextInput style={styles.input} placeholder="Car Reg Number" value={kerbsideReg} onChangeText={setKerbsideReg} />
            </View>}
            <View style={{ flexDirection: "row", marginTop: 10 }}>
              <TouchableOpacity style={styles.changeButton} onPress={() => {
                setDeliveryMethod(null); setKerbsideName(""); setKerbsideColor(""); setKerbsideReg("");
              }}>
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.continueButton} onPress={continueDeliverySelection}>
                <Text style={styles.continueText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Allergy Modal */}
      <Modal visible={allergyPopup} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.popupContainer}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center" }}>
            <View style={styles.popupBox}>
              <Text style={styles.popupTitle}>
                Do you have any allergy or dietary requirements?
              </Text>

              <TextInput
                style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
                placeholder="Add your note (optional)"
                value={allergyNote}
                multiline
                onChangeText={setAllergyNote}
              />

              <TouchableOpacity
                style={[styles.continueButton, { marginTop: 15 }]}
                onPress={() => setAllergyPopup(false)}
              >
                <Text style={styles.continueText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Order Success Modal */}
      <Modal visible={orderPlaced} transparent animationType="fade">
        <View style={styles.orderModalContainer}>
          <View style={styles.orderBox}>
            <Text style={styles.orderText}>Order Placed Successfully 🎉</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CheckoutScreen;

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:"#fff"},
  summaryBox:{backgroundColor:"#eef7ff",padding:15,margin:15,borderRadius:10},
  sumTitle:{fontSize:16,fontWeight:"700",marginBottom:5},
  sumText:{fontSize:14,marginBottom:3},
  itemBox:{backgroundColor:"#f5f5f5",padding:15,borderRadius:10,marginBottom:12,flexDirection:"row",justifyContent:"space-between"},
  itemName:{fontSize:16,fontWeight:"600"},
  itemPrice:{fontSize:16,fontWeight:"600"},
  totalBox:{padding:20,borderTopWidth:1,borderColor:"#ddd"},
  totalText:{fontSize:20,fontWeight:"700",textAlign:"right"},
  placeOrderButton:{backgroundColor:"#1a73e8",margin:20,padding:15,borderRadius:10},
  placeOrderText:{textAlign:"center",color:"#fff",fontWeight:"700",fontSize:18},
  popupContainer:{flex:1,justifyContent:"center",alignItems:"center",backgroundColor:"rgba(0,0,0,0.5)"},
  popupBox:{width:"85%",backgroundColor:"#fff",padding:20,borderRadius:12},
  popupTitle:{fontSize:18,fontWeight:"700",marginBottom:15,textAlign:"center"},
  methodButton:{padding:14,backgroundColor:"#f2f2f2",borderRadius:10,marginBottom:12},
  methodText:{fontSize:16,textAlign:"center"},
  selectedMethod:{backgroundColor:"#1a73e8"},
  kerbsideFields:{marginTop:10},
  input:{borderWidth:1,borderColor:"#ccc",padding:12,borderRadius:8,marginBottom:10},
  changeButton:{flex:1,padding:12,backgroundColor:"#888",borderRadius:8,marginRight:10},
  changeText:{color:"#fff",fontSize:15,textAlign:"center"},
  continueButton:{flex:1,padding:12,backgroundColor:"#1a73e8",borderRadius:8},
  continueText:{color:"#fff",fontSize:15,textAlign:"center"},
  orderModalContainer:{flex:1,justifyContent:"center",alignItems:"center",backgroundColor:"rgba(0,0,0,0.4)"},
  orderBox:{backgroundColor:"#fff",padding:25,borderRadius:10},
  orderText:{fontSize:20,fontWeight:"700"}
});
