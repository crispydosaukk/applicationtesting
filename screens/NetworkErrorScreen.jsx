import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

export default function NetworkErrorScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/empty.png")}
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.txt}>Network issue</Text>
      <Text style={styles.sub}>Please check your internet connection</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  image: { width: 200, height: 200 },
  txt: { fontSize: 22, fontWeight: "700", marginTop: 20 },
  sub: { color: "#666", marginTop: 6, fontSize: 16 },
});
