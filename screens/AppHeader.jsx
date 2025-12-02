// AppHeader.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const scale = width / 400;

export default function AppHeader({ user, onMenuPress, navigation, cartItems }) {
  const insets = useSafeAreaInsets();
  const totalItems = cartItems ? Object.values(cartItems).reduce((a, b) => a + b, 0) : 0;

  const username = user?.full_name ? user.full_name.split(" ")[0] : user?.restaurant_name ? user.restaurant_name : "Guest";

  return (
    <>
      <StatusBar backgroundColor="#d7f7df" barStyle="dark-content" />
      <SafeAreaView style={{ width:"100%",backgroundColor:"#d7f7df",paddingTop:insets.top,paddingLeft:insets.left,paddingRight:insets.right }} edges={["top","left","right"]}>
        <LinearGradient colors={["#d7f7df","#ffffff"]} style={{ width:"100%",paddingHorizontal:10,paddingBottom:10,flexDirection:"row",alignItems:"center",justifyContent:"space-between" }}>
          <TouchableOpacity style={{ flexDirection:"row",alignItems:"center",flexShrink:1 }} activeOpacity={0.8} onPress={() => { if (!user) navigation.replace("Login"); }}>
            <Ionicons name="person-circle-outline" size={42 * scale} color="#222" style={{ marginRight:8 * scale }} />
            <View style={{ flexShrink:1 }}>
              <Text style={{ fontSize:17 * scale,fontWeight:"700",color:"#222" }}>Hello {username} 👋</Text>
              <Text style={{ fontSize:13 * scale,color:"#666",marginTop:2 }}>{user ? "What are you craving today?" : "Tap to sign in"}</Text>
            </View>
          </TouchableOpacity>

          <View style={{ flexDirection:"row",alignItems:"center" }}>
            <TouchableOpacity style={{ marginLeft:10,padding:4 }}>
              <Ionicons name="notifications-outline" size={26 * scale} color="#222" />
            </TouchableOpacity>

            <TouchableOpacity style={{ marginLeft:10,padding:4 }} onPress={() => navigation.navigate("CartSummary")}>
              <Ionicons name="cart-outline" size={28 * scale} color="#222" />
              {totalItems > 0 && (
                <View style={{ position:"absolute",right:-4,top:-4,backgroundColor:"#ff3b30",minWidth:16 * scale,height:16 * scale,borderRadius:20,justifyContent:"center",alignItems:"center",paddingHorizontal:3 }}>
                  <Text style={{ color:"#fff",fontWeight:"700",fontSize:10 * scale }}>{totalItems}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={{ marginLeft:10,padding:4 }} onPress={onMenuPress}>
              <Ionicons name="menu-outline" size={32 * scale} color="#222" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    </>
  );
}
