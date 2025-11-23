import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from "react-native";
import AppHeader from "./AppHeader";
import BottomBar from "./BottomBar";

export default function CartSummary({ route, navigation }) {
  const { cartItems, notes, collectionType, kerbsideDetails, allergyNotes, products } = route.params;
  const cartKeys = Object.keys(cartItems);

  const calculateTotal = (price, qty) => (price * qty).toFixed(2);

  const grandTotal = cartKeys.reduce((sum, id) => {
    const product = products.find(p => p.id == id);
    if (!product) return sum;
    const price = Number(product.discount_price ?? product.price ?? 0);
    return sum + price * cartItems[id];
  }, 0).toFixed(2);

  return (
    <View style={styles.container}>
      <AppHeader navigation={navigation} />

      <FlatList
        data={cartKeys}
        keyExtractor={(id) => id.toString()}
        ListHeaderComponent={
          <>
            <Text style={styles.heading}>Your Cart</Text>
            <View style={styles.divider} />
          </>
        }
        renderItem={({ item: id }) => {
          const product = products.find(p => p.id == id);
          if (!product) return null;

          const qty = cartItems[id];
          const price = Number(product.discount_price ?? product.price ?? 0);
          const total = calculateTotal(price, qty);

          return (
            <View style={styles.card}>
              <View style={styles.cardContent}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productNote}>{notes[id]}</Text>
                  <View style={styles.qtyPriceRow}>
                    <Text style={styles.qtyText}>Qty: {qty}</Text>
                    <Text style={styles.priceText}>£{price.toFixed(2)}</Text>
                  </View>
                </View>
                <Text style={styles.totalText}>£{total}</Text>
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          <View style={{ marginTop: 20, marginBottom: 100 }}>
            <View style={styles.divider} />

            {/* Collection Type */}
            <Text style={styles.subHeading}>Collection Type</Text>
            <View style={styles.collectionCard}>
              <Text style={styles.collectionText}>{collectionType === "kerbside" ? "Kerbside Pickup" : "In Store Pickup"}</Text>
              {collectionType === "kerbside" && (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.collectionText}>Car Color: {kerbsideDetails.carColor}</Text>
                  <Text style={styles.collectionText}>Reg No: {kerbsideDetails.carRegNumber}</Text>
                  <Text style={styles.collectionText}>Owner: {kerbsideDetails.carOwner}</Text>
                </View>
              )}
            </View>

            {/* Allergy Notes */}
            {allergyNotes ? (
              <View style={[styles.collectionCard, { marginTop: 12 }]}>
                <Text style={styles.subHeading}>Allergy / Dietary Notes</Text>
                <Text style={styles.collectionText}>{allergyNotes}</Text>
              </View>
            ) : null}

            {/* Grand Total */}
            <View style={styles.grandTotalContainer}>
              <Text style={styles.grandTotalText}>Grand Total</Text>
              <Text style={styles.grandTotalAmount}>£{grandTotal}</Text>
            </View>

            {/* Checkout Button */}
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() => navigation.navigate("Checkout", { cartItems, notes, collectionType, kerbsideDetails, allergyNotes })}
            >
              <Text style={styles.checkoutText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={{ padding: 16 }}
      />

      <BottomBar navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  heading: { fontSize: 24, fontWeight: "700", color: "#222", marginVertical: 12 },
  subHeading: { fontSize: 16, fontWeight: "600", color: "#333" },
  divider: { height: 1, backgroundColor: "#e0e0e0", marginVertical: 12 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  productName: { fontSize: 16, fontWeight: "700", color: "#222" },
  productNote: { fontSize: 14, color: "#666", marginTop: 4 },
  qtyPriceRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  qtyText: { fontSize: 14, fontWeight: "600", color: "#555" },
  priceText: { fontSize: 14, fontWeight: "600", color: "#28a745" },
  totalText: { fontSize: 16, fontWeight: "700", color: "#000" },

  collectionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginTop: 8,
  },
  collectionText: { fontSize: 14, color: "#555", marginTop: 2 },

  grandTotalContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 20, padding: 16, backgroundColor: "#fff", borderRadius: 12, elevation: 3 },
  grandTotalText: { fontSize: 16, fontWeight: "700", color: "#222" },
  grandTotalAmount: { fontSize: 18, fontWeight: "700", color: "#28a745" },

  checkoutButton: { backgroundColor: "#ff6f00", borderRadius: 12, paddingVertical: 16, marginTop: 20, alignItems: "center" },
  checkoutText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
