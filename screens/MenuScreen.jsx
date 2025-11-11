import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function MenuScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello Menu</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF6E8",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FF7A00",
  },
});
