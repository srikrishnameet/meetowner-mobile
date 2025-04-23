import React, { useCallback, useState } from "react";
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  KeyboardAvoidingView,
  TouchableOpacity,
  BackHandler,
} from "react-native";
import {
  FlatList,
  HStack,
  Image,
  Pressable,
  Text,
  View,
  useDisclose,
  Actionsheet,
  StatusBar,
} from "native-base";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import config from "../../config";
export default function Wishlist() {
  const navigation = useNavigation();
  const [state, setState] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclose();
  const [userInfo, setUserInfo] = useState("");
  const removeItem = useCallback(
    async (id) => {
      await handleInterestAPI(id, 1);
      fetchPropertyList(userInfo.user_id, "interested_property_fetch").then(
        (newData) => {
          setState(newData);
        }
      );
    },
    [userInfo.user_id]
  );
  React.useEffect(() => {
    const backAction = () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        Alert.alert("Exit App", "Do you want to exit?", [
          { text: "Cancel", style: "cancel" },
          { text: "Exit", onPress: () => BackHandler.exitApp() },
        ]);
      }
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, []);
  const formatToIndianCurrency = (value) => {
    if (value >= 10000000) return (value / 10000000).toFixed(2) + " Cr";
    if (value >= 100000) return (value / 100000).toFixed(2) + " L";
    if (value >= 1000) return (value / 1000).toFixed(2) + " K";
    return value?.toString();
  };
  const shareItem = (id) => {};
  const [enquiredItems, setEnquiredItems] = useState({});
  const handleEnquiry = (id) => {
    setEnquiredItems((prev) => ({
      ...prev,
      [id]: true,
    }));
  };
  const PropertyCard = ({ item, onRemove, onShare, onEnquire, enquired }) => {
    return (
      <Pressable
        bg="white"
        rounded="lg"
        shadow={3}
        overflow="hidden"
        mb={3}
        borderWidth={1}
        borderColor="gray.200"
      >
        <View position="relative">
          <Image
            source={{
              uri: `https://api.meetowner.in/uploads/${item?.property_details?.image}`,
              cache: "force-cache",
            }}
            alt="Property Image"
            w="100%"
            h={180}
            resizeMode="cover"
          />
          <View
            position="absolute"
            top={2}
            left={2}
            bg="white:alpha.80"
            px={3}
            py={1}
            rounded="md"
            opacity={0.75}
          >
            <Text color="black" fontSize="xs" bold>
              {item?.property_details?.property_for}
            </Text>
          </View>
          <HStack position="absolute" top={2} right={2} space={2}>
            <Pressable
              p={2}
              bg="white"
              rounded="full"
              onPress={() =>
                onRemove(item?.property_details.unique_property_id, 1)
              }
            >
              <Ionicons name="heart" size={20} color="red" />
            </Pressable>
            <Pressable
              p={2}
              bg="white"
              rounded="full"
              onPress={() => onShare(item?.id)}
            >
              <Ionicons name="share-social-outline" size={20} color="black" />
            </Pressable>
          </HStack>
          <View
            position="absolute"
            bottom={2}
            left={2}
            right={2}
            flexDirection="row"
            justifyContent="left"
            gap={3}
          >
            {item?.property_details?.bedrooms && (
              <HStack
                bg="white:alpha.80"
                px={2}
                py={1}
                rounded="lg"
                alignItems="center"
              >
                <Text color="black" fontSize="xs">
                  {item?.property_details?.bedrooms} BHK
                </Text>
              </HStack>
            )}
            {item?.property_details?.bathrooms && (
              <HStack
                bg="white:alpha.80"
                px={2}
                py={1}
                rounded="lg"
                alignItems="center"
              >
                <Text color="black" fontSize="xs">
                  {item?.property_details?.bathrooms} Bath
                </Text>
              </HStack>
            )}
            {item?.property_details?.car_parking && (
              <HStack
                bg="white:alpha.80"
                px={2}
                py={1}
                rounded="lg"
                alignItems="center"
              >
                <Text color="black" fontSize="xs">
                  {item?.property_details?.car_parking} Parking
                </Text>
              </HStack>
            )}
          </View>
        </View>
        <HStack justifyContent="space-between" px={3} py={1}>
          <View flex={1}>
            <Text fontSize="sm" bold color="gray.500" numberOfLines={1}>
              {item?.property_details?.property_name}
            </Text>
          </View>
          <View>
            <Text fontSize="sm" bold color="gray.800">
              ₹ {formatToIndianCurrency(item?.property_details?.property_cost)}
            </Text>
          </View>
        </HStack>
        <HStack justifyContent="space-between" px={3} py={1}>
          <View flex={1}>
            <Text fontSize="xs" bold color="gray.500" numberOfLines={1}>
              {item?.property_details?.google_address}
            </Text>
          </View>
        </HStack>
        <Pressable
          bg="#1D3A76"
          py={2}
          alignItems="center"
          borderRadius={10}
          width="95%"
          alignSelf="center"
          my={1}
          onPress={() => onEnquire(item?.id)}
        >
          <Text color="white" bold>
            {enquired ? "Our executive will contact you soon!" : "Enquire Now"}
          </Text>
        </Pressable>
      </Pressable>
    );
  };
  const handleInterestAPI = async (id, action) => {
    console.log("id: ", id);
    try {
      await fetch(
        `${config.mainapi_url}/favourites_exe?user_id=${userInfo.user_id}&unique_property_id=${id}&intrst=1&action=1`
      );
      fetchPropertyList(userInfo.user_id, "interested_property_fetch");
    } catch (error) {}
  };
  async function fetchPropertyList(user_id, filterType) {
    let url = `${config.mainapi_url}/Api/newapi?fetchtype=${filterType}&user_id=${user_id}`;
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const udata = await response.json();
      const { data } = udata;
      if (response.ok) {
        setState(data);
      }
    } catch (error) {
    } finally {
      setIsLoadingEffect(false);
    }
  }
  let filteredState = [];
  if (Array.isArray(state)) {
    filteredState = state.reduce((acc, current) => {
      const x = acc.find(
        (item) =>
          item?.property_details?.unique_property_id ===
          current?.property_details?.unique_property_id
      );
      if (!x) {
        acc.push(current);
      }
      return acc;
    }, []);
  }

  useEffect(() => {
    const getData = async () => {
      const data = await AsyncStorage.getItem("userdetails");
      const parsedUserDetails = JSON.parse(data);
      setUserInfo(parsedUserDetails);
      if (parsedUserDetails?.user_id) {
        fetchPropertyList(
          parsedUserDetails.user_id,
          "interested_property_fetch"
        );
      }
    };
    getData();
  }, []);
  useFocusEffect(
    useCallback(() => {
      if (userInfo?.user_id) {
        fetchPropertyList(userInfo.user_id, "interested_property_fetch");
      }
    }, [userInfo?.user_id])
  );
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <HStack
            px={5}
            py={3}
            space={5}
            justifyContent={"flex-end"}
            alignItems={"center"}
          >
            <TouchableOpacity onPress={onOpen}>
              <View
                flexDirection={"row"}
                borderWidth={0.5}
                borderRadius={30}
                bg={"#1D3A76"}
                px={3}
                gap={2}
                py={1}
              >
                <Text fontSize={15} fontWeight={"bold"} color={"#fff"}>
                  Filter
                </Text>
                <Ionicons name="filter-outline" size={20} color="white" />
              </View>
            </TouchableOpacity>
          </HStack>
          {!state || undefined ? (
            <View style={styles.noFavouritesContainer}>
              <Image
                source={require("../../assets/add_15869358.png")}
                alt="WhatsApp"
                resizeMethod="contain"
                style={styles.logo}
              />
              <Text>No Favourites Found</Text>
            </View>
          ) : (
            <FlatList
              data={filteredState}
              renderItem={({ item }) => (
                <View px={3} py={2}>
                  <PropertyCard
                    item={item}
                    onRemove={removeItem}
                    onShare={shareItem}
                    onEnquire={handleEnquiry}
                    enquired={enquiredItems[item?.id]}
                  />
                </View>
              )}
              keyExtractor={(item, index) =>
                item?.property_details?.unique_property_id
                  ? item?.property_details?.unique_property_id.toString()
                  : `item-${index}`
              }
              contentContainerStyle={{
                paddingBottom: 100,
              }}
            />
          )}

          <Actionsheet isOpen={isOpen} onClose={onClose}>
            <Actionsheet.Content>
              <Text fontSize="lg" fontWeight="bold" mb={3}>
                Filter Properties
              </Text>
              <Pressable
                w="100%"
                py={3}
                px={4}
                onPress={() => {
                  fetchPropertyList(
                    userInfo?.user_id,
                    "shedule_property_fetch"
                  );
                  onClose();
                }}
              >
                <Text fontSize="md">Scheduled Visiting</Text>
              </Pressable>
              <Pressable
                w="100%"
                py={3}
                px={4}
                onPress={() => {
                  fetchPropertyList(
                    userInfo?.user_id,
                    "interested_property_fetch"
                  );
                  onClose();
                }}
              >
                <Text fontSize="md">Interested Properties</Text>
              </Pressable>
              <Pressable
                w="100%"
                py={3}
                px={4}
                onPress={() => {
                  fetchPropertyList(
                    userInfo?.user_id,
                    "contact_property_fetch"
                  );
                  onClose();
                }}
              >
                <Text fontSize="md">Contact Sellers</Text>
              </Pressable>
            </Actionsheet.Content>
          </Actionsheet>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 18,
  },
  flatListContainer: {
    paddingHorizontal: 15,
  },
  noFavouritesContainer: {
    flex: 1,
    bottom: 50,
    justifyContent: "center",
    alignItems: "center",
  },
});
