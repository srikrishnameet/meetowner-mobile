import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  BackHandler,
  Platform,
} from "react-native";
import {
  View,
  HStack,
  Text,
  Actionsheet,
  useDisclose,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
} from "native-base";
import Banner1 from "../../../assets/Banner1.jpg";
import Banner2 from "../../../assets/Banner2.jpeg";
import Banner3 from "../../../assets/Banner4.jpg";
import "react-native-get-random-values";
import { useNavigation } from "@react-navigation/native";
import { useSelector, shallowEqual, useDispatch } from "react-redux";
import * as Location from "expo-location";
import { debounce } from "lodash";
import { Ionicons } from "@expo/vector-icons";
import config from "../../../config";
import {
  setCities,
  setDeviceLocation,
  setPropertyDetails,
} from "../../../store/slices/propertyDetails";
export default function SearchBox() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclose();
  const cities = useSelector((state) => state.property.cities, shallowEqual);
  const trending = useSelector((state) => state.property.trendingProjects);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState("");
  const fetchSuggestions = async (city_id, query) => {
    if (!query || query.length < 3 || !city_id) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `${config.awsApiUrl}/general/getlocalitiesbycitynamenew?city_id=${city_id}&input=${query}`
      );
      const data = await response.json();
      if (data?.status === "success") {
        setSuggestions(data?.places || []);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  const debouncedFetchSuggestions = useCallback(
    debounce((city_id, query) => {
      fetchSuggestions(city_id, query);
    }, 300),
    []
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
  useEffect(() => {
    const fetchCities = async () => {
      try {
        if (cities.length === 0) {
          const response = await fetch(
            "https://api.meetowner.in/general/getcities"
          );
          const data = await response.json();
          dispatch(setCities(data.cities || []));
        }
      } catch (error) {}
    };
    fetchCities();
    getUserLocation();
    fetchProperties();
  }, [dispatch, cities.length]);
  const getUserLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location access is required.");
        dispatch(setDeviceLocation("Unknown City"));
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      const { latitude, longitude } = location.coords;
      const geocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      if (geocode.length > 0) {
        const city = geocode[0]?.city || "Unknown City";
        setUserLocation(city);
        dispatch(setDeviceLocation(city));
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      dispatch(setDeviceLocation("Unknown City"));
    }
  };
  useEffect(() => {
    setLocations(cities);
    setFilteredLocations(cities);
    if (userLocation && cities.length > 0) {
      const matchedCity = cities.find(
        (city) => city.label.toLowerCase() === userLocation.toLowerCase()
      );
      if (matchedCity) {
        setSelectedLocation({
          label: matchedCity.label,
          value: matchedCity.value,
        });
      } else {
        setSelectedLocation(null);
      }
    }
  }, [cities, userLocation]);
  const handleSearch = useMemo(
    () => (query) => {
      if (query === searchQuery) return;
      setSearchQuery(query);
      setFilteredLocations(
        query === ""
          ? locations
          : locations.filter((loc) =>
              loc.label.toLowerCase().includes(query.toLowerCase())
            )
      );
    },
    [searchQuery]
  );
  const handleLocationSearch = (text) => {
    const trimmedText = text.trim();
    setSearchQuery(trimmedText);
    if (trimmedText === "" || trimmedText.length < 3) {
      setSuggestions([]);
      return;
    }
    debouncedFetchSuggestions(selectedLocation?.value, trimmedText);
  };
  const handleCitySelect = (item) => {
    setSelectedLocation(item);
    onClose();
  };
  const renderItem = useCallback(
    ({ item }) => (
      <TouchableOpacity
        onPress={() => handleCitySelect(item)}
        style={styles.fullWidthItem}
      >
        <Text style={styles.fullWidthText}>{item.label}</Text>
      </TouchableOpacity>
    ),
    [handleCitySelect]
  );

  const handlePropertiesLists = () => {
    navigation.navigate("PropertyList", {
      prevSearch: searchQuery,
      prevLocation: selectedLocation,
    });
  };
  const ImagesData = [
    {
      id: 1,
      image: Banner3,
      color: "#D3D3D3",
    },
    {
      id: 2,
      image: Banner2,
      color: "#E0E0E0",
    },
    {
      id: 3,
      image: Banner1,
      color: "#E0E0E0",
    },
  ];
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => {
    if (flatListRef.current && trends.length > 0) {
      const interval = setInterval(() => {
        const nextIndex = (currentIndex + 1) % trends.length;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        setCurrentIndex(nextIndex);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [currentIndex, trends?.length]);
  const onScrollEnd = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.floor(contentOffsetX / Dimensions.get("window").width);
  };
  const handleFetchLiveLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location access is required to fetch your current location."
        );
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      });
      const { latitude, longitude } = location.coords;
      const geocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      if (geocode.length > 0) {
        const place = geocode[0];
        const city = place?.formattedAddress || "";
        const modifiedCity = city.split(",").slice(1, 4).join(", ").trim();
        setSearchQuery(modifiedCity);
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
    }
  };
  const [trends, setTrends] = useState([]);
  const fetchProperties = async (reset = false) => {
    const response = await fetch(
      `https://api.meetowner.in/listings/getlatestproperties?limit=5&type_of_property=Sell&city_id=4`
    );
    const data = await response.json();
    if (data.propertiesData && data.propertiesData.length > 0) {
      setTrends(data.propertiesData.slice(0, 4));
    }
  };
  const handleNavigate = useCallback(
    (item) => {
      dispatch(setPropertyDetails(item));
      navigation.navigate("PropertyDetails");
    },
    [navigation]
  );
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 70,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.currentLocation}>
          <TouchableOpacity
            onPress={handleFetchLiveLocation}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#f0f0f0",
              borderRadius: 20,
              padding: 5,
            }}
          >
            <Ionicons name="locate" size={18} color="red" />
            <Text style={{ marginLeft: 5, color: "#333", fontSize: 14 }}>
              Use Current Location
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <TouchableOpacity style={styles.cityButton} onPress={onOpen}>
            <HStack space={1} alignItems="center">
              <Ionicons name="location-outline" size={20} color="orange" />
              <Text style={styles.cityText}>
                {selectedLocation?.label || selectedLocation || "Select City"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="gray" />
            </HStack>
          </TouchableOpacity>
          <View style={{ flex: 1, position: "relative" }}>
            <TextInput
              placeholder="Search city, locality, properties"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={(text) => {
                handleLocationSearch(text);
              }}
              selectTextOnFocus={false}
              style={styles.textInput}
            />
            {searchQuery.trim() !== "" && (
              <TouchableOpacity
                onPress={() => {
                  handleLocationSearch("");
                }}
                style={styles.cancelIcon}
              >
                <Ionicons name="close-circle" size={22} color="gray.400" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handlePropertiesLists}
          >
            <Ionicons name="search" size={26} color="gray" />
          </TouchableOpacity>
        </View>
        <View style={styles.suggestionsContainer}>
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color="#999" />
            </View>
          ) : suggestions.length > 0 ? (
            <View style={[styles.suggestionsList]}>
              <TouchableOpacity
                onPress={() => {
                  setSuggestions([]);
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close-circle" size={22} color="#000" />
              </TouchableOpacity>
              <FlatList
                data={suggestions}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => {
                      setSearchQuery(item?.value || item?.label);
                      setSuggestions([]);
                    }}
                  >
                    <Text style={styles.suggestionText}>{item?.label}</Text>
                  </TouchableOpacity>
                )}
                nestedScrollEnabled={true}
                style={styles.suggestionsList}
              />
            </View>
          ) : null}
        </View>
        <View>
          <FlatList
            ref={flatListRef}
            data={ImagesData}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.adItem1,
                  { backgroundColor: item.color || "#D3D3D3" },
                ]}
              >
                <Image
                  source={
                    typeof item.image === "string"
                      ? { uri: item.image }
                      : item.image
                  }
                  resizeMode="stretch"
                  style={{
                    flex: 1,
                    width: "100%",
                    height: "100%",
                    borderRadius: 20,
                  }}
                />
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id.toString()}
            nestedScrollEnabled={true}
          />
        </View>
        <View>
          <FlatList
            style={{ padding: 10 }}
            ref={flatListRef}
            data={[
              {
                id: "1",
                title: "Comprehensive Property Listings",
                description:
                  "Explore a wide range of properties tailored to your needs.",
              },
              {
                id: "2",
                title: "Location-Based Search",
                description: "Find properties in your desired area with ease.",
              },
              {
                id: "3",
                title: "Location-Based Properties",
                description: "Find properties in your desired area with ease.",
              },
            ]}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingRight: 140,
            }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 20,
                  marginRight: 15,
                  borderWidth: 1,
                  borderColor: "#e0e0e0",
                  padding: 15,
                  width: 280,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 5,
                }}
                onPress={handlePropertiesLists}
              >
                <Text
                  style={{
                    color: "#1e3a8a",
                    fontSize: 18,
                    fontWeight: "600",
                    marginBottom: 8,
                  }}
                >
                  {item.title}
                </Text>
                <Text
                  style={{
                    color: "#4b5563",
                    fontSize: 14,
                    lineHeight: 20,
                    marginBottom: 12,
                  }}
                >
                  {item.description}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color="#7c3aed"
                  style={{
                    alignSelf: "flex-end",
                    padding: 5,
                    backgroundColor: "rgba(124, 58, 237, 0.1)",
                    borderRadius: 50,
                  }}
                />
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id.toString()}
            nestedScrollEnabled={true}
          />
        </View>
        <View style={styles.Tsection}>
          <Text fontSize="md" fontWeight="bold" mb={2}>
            Trending Projects
          </Text>
          <FlatList
            ref={flatListRef}
            data={trends}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.adItem, { backgroundColor: item.color }]}
                onPress={() => handleNavigate(item)}
              >
                <View
                  style={{ flex: 1, flexDirection: "row", overflow: "hidden" }}
                >
                  <Image
                    source={{
                      uri: `https://meetowner.in/uploads/${item?.image}`,
                    }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                  <View>
                    <Text style={styles.adTitle}>
                      <Text style={{ fontWeight: "bold" }}>
                        {item?.property_name}
                      </Text>
                    </Text>
                    <Text style={styles.adDescription}>
                      <Text style={{ fontWeight: "bold" }}>Address: </Text>
                      {item?.google_address}
                    </Text>
                    <Text style={styles.adDescription}>
                      <Text style={{ fontWeight: "bold" }}>Property In: </Text>
                      {item?.property_in} Property
                    </Text>
                    <Text style={styles.adDescription}>
                      <Text style={{ fontWeight: "bold" }}>
                        Property SubType:{" "}
                      </Text>
                      {item?.property_subtype}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id.toString()}
            nestedScrollEnabled={true}
          />
        </View>
      </ScrollView>
      <TouchableOpacity
        style={styles.fixedExploreButton}
        onPress={handlePropertiesLists}
      >
        <HStack alignItems="center" justifyContent="center" py={4}>
          <Ionicons name="compass-outline" size={20} color="purple.600" />
          <Text color="#1D3A76" ml={2}>
            <Text fontWeight="bold">View all properties</Text>
          </Text>
        </HStack>
      </TouchableOpacity>
      <Actionsheet isOpen={isOpen} onClose={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ width: "100%" }}
        >
          <Actionsheet.Content
            justifyContent="flex-start"
            alignItems="flex-start"
            maxHeight={500}
            width="100%"
          >
            <TextInput
              placeholder="Search city"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={handleSearch}
              style={styles.actionsheetInput}
            />
            <FlatList
              data={filteredLocations}
              keyExtractor={(item, index) => `${item.label}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleCitySelect(item)}
                  style={styles.fullWidthItem}
                >
                  <Text style={styles.fullWidthText}>{item.label}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={{ textAlign: "center", color: "gray" }}>
                  No locations found
                </Text>
              }
              contentContainerStyle={{ width: "100%" }}
              style={{ width: "100%" }}
              nestedScrollEnabled={true}
            />
          </Actionsheet.Content>
        </KeyboardAvoidingView>
      </Actionsheet>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 8,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 10,
  },
  suggestionsContainer: {
    position: "relative",
    top: 2,
    justifyContent: "center",
    alignItems: "center",
    flex: 0.3,
    width: "90%",
    alignSelf: "center",
    zIndex: 1,
  },
  searchContainer: {
    width: "100%",
    borderWidth: 0.5,
    borderRadius: 30,
    marginBottom: 2,
    borderColor: "#ddd",
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  cityButton: {
    paddingHorizontal: 6,
    paddingRight: 2,
    justifyContent: "center",
    alignItems: "center",
    height: 60,
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 30,
    backgroundColor: "#f9f9f9",
  },
  cityText: {
    fontSize: 12,
    color: "#333",
  },
  textInput: {
    height: 60,
    fontSize: 14,
    color: "#333",
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: 10,
    borderRadius: 30,
  },
  iconButton: {
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
    height: 60,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    backgroundColor: "#f9f9f9",
  },
  currentLocation: {
    justifyContent: "flex-end",
    alignItems: "flex-end",
    margin: 5,
  },
  exploreOptions: {
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 30,
    marginTop: 10,
  },
  fixedExploreButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    zIndex: 1000,
  },
  Tsection: {
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  actionsheetInput: {
    width: "100%",
    height: 50,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 16,
    fontSize: 16,
    marginVertical: 8,
  },
  cancelIcon: {
    position: "absolute",
    right: 3,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
  fullWidthItem: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  fullWidthText: {
    fontSize: 16,
    color: "#333",
  },
  adItem: {
    width: Dimensions.get("window").width - 60,
    height: 130,
    padding: 10,
    marginBottom: 15,
    borderRadius: 20,
    borderWidth: 0.5,
    marginLeft: 10,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: "center",
  },
  adTitle: {
    fontSize: 14,
    marginBottom: 5,
  },
  adDescription: {
    fontSize: 12,
    marginBottom: 5,
  },
  icon: {
    marginTop: 5,
  },
  adItem1: {
    width: Dimensions.get("window").width - 60,
    height: 150,
    margin: 10,
    borderRadius: 20,
    marginLeft: 10,
  },
  suggestionsList: {
    position: "absolute",
    top: 1,
    left: 0,
    right: 0,
    backgroundColor: "white",
    maxHeight: 200,
    width: "100%",
    borderRadius: 8,
    elevation: 5,
    zIndex: 999,
  },
  closeButton: {
    position: "absolute",
    top: 3,
    right: 5,
    zIndex: 1000,
    padding: 2,
    borderRadius: 15,
    elevation: 3,
  },
  closeIcon: {
    fontSize: 18,
    color: "#000",
  },
  loaderContainer: {
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionItem: {
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  suggestionText: {
    fontSize: 16,
    color: "#333",
  },
});
