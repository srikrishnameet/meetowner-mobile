import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Pressable, Text, StyleSheet } from "react-native";
import { HStack, Icon } from "native-base";
import { Ionicons } from "@expo/vector-icons";
import LoginScreen from "../Auth/Login";
import SplashScreen from "../Auth/SplashScreen";
import PageNavs from "./PageNavs";
import OtpScreen from "../Auth/OtpScreen";
import PropertyDetails from "../Pages/components/PropertyDetails";
import Profile from "../Pages/components/Profile";
import PropertyLists from "../Pages/components/PropertyLists";
import Wishlist from "../Pages/Wishlist";
import { Platform } from "react-native";
import Support from "../Pages/Support";
import SearchBox from "../Pages/components/SearchBox";
const Stack = createNativeStackNavigator();
const CustomHeader = ({ navigation, title, route, icon }) => {
  return (
    <HStack
      style={styles.header}
      justifyContent="space-between"
      alignItems="center"
    >
      <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}>
        <Icon as={Ionicons} name="arrow-back" size={6} color="#000" />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <Pressable onPress={() => navigation.navigate(route)}>
        <Icon as={Ionicons} name={icon} size={6} color="#000" />
      </Pressable>
    </HStack>
  );
};



export default function MainNav() {
  return (
    <NavigationContainer>
      <SafeAreaProvider>
        <Stack.Navigator initialRouteName="Splash">
          <Stack.Screen
            name="Splash"
            component={SplashScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="OtpScreen"
            component={OtpScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="dashboard"
            component={PageNavs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Support"
            component={Support}
            options={{ headerShown: false }}
          />
         <Stack.Screen
        name="PropertyDetails"
        component={PropertyDetails}
        options={{ headerShown: true }} // Header is set in PropertyDetails
      />
          <Stack.Screen
            name="Wishlist"
            component={Wishlist}
            options={({ navigation }) => ({
              header: () => (
                <CustomHeader
                  navigation={navigation}
                  title="Wishlist"
                  route="Wishlist"
                  icon=""
                />
              ),
            })}
          />
          <Stack.Screen
            name="Profile"
            component={Profile}
            options={({ navigation }) => ({
              header: () => (
                <CustomHeader
                  navigation={navigation}
                  title=""
                  route="dashboard"
                  icon=""
                />
              ),
            })}
          />
          <Stack.Screen
            name="SearchBox"
            component={SearchBox}
            options={({ navigation }) => ({
              header: () => (
                <CustomHeader
                  navigation={navigation}
                  title="Filters"
                  route="Wishlist"
                  icon="heart-outline"
                />
              ),
            })}
          />
          <Stack.Screen
            name="PropertyList"
            component={PropertyLists}
            options={({ navigation }) => ({
              header: () => (
                <CustomHeader
                  navigation={navigation}
                  title="Property Lists"
                  route="Wishlist"
                  icon="heart-outline"
                />
              ),
            })}
          />
        </Stack.Navigator>
      </SafeAreaProvider>
    </NavigationContainer>
  );
}
const styles = StyleSheet.create({
  header: {
    paddingBottom: 10,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingHorizontal: 18,
    backgroundColor: '#f5f5f5',
   
  },
  iconButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
});
