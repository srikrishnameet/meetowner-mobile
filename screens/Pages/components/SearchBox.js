import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
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
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSelector, shallowEqual, useDispatch } from "react-redux";
import * as Location from "expo-location";
import { debounce } from "lodash";
import { BackHandler } from "react-native";
import {
  setCities,
  setDeviceLocation,
  setPropertyDetails,
} from "../../../store/slices/propertyDetails";
import { PropertyTypeIcon } from "./SearchBarComponents/PropertyIcon";
import { FilterSection } from "./SearchBarComponents/FilterSection";
import { FilterOption } from "./SearchBarComponents/FilterOption";
import SearchBarSection from "./SearchBarComponents/SearchBarSection";
import { setBHK, setOccupancy, setPropertyIn, setSearchData, setSubType,setLocation } from "../../../store/slices/searchSlice";

export default function SearchBox() {
  const tab = useSelector((state)=> state.search.tab);
  const propertyIn = useSelector((state) => state.search.property_in); 
  const subType = useSelector((state) => state.search.sub_type);
  const bhk = useSelector((state) => state.search.bhk);
  const occupancy = useSelector((state)=>state.search.occupancy);
  const location = useSelector((state)=> state.search.location);
  console.log("search",tab,propertyIn,subType,bhk,occupancy,location);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { isOpen, onOpen, onClose } = useDisclose();
  const cities = useSelector((state) => state.property.cities, shallowEqual);
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(location || "");
  const [selectedPropertyType, setSelectedPropertyType] = useState(tab || "Buy");
  const [selectedBuildingType, setSelectedBuildingType] = useState(propertyIn || "Residential");
  const [selectedSubPropertyType, setSelectedSubPropertyType] = useState(subType || "Apartment");
  const [selectedBedrooms, setSelectedBedrooms] = useState(bhk || "");
  const [selectedFurnishing, setSelectedFurnishing] = useState("");
  const [selectedPostedBy, setSelectedPostedBy] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedPossession, setSelectedPossession] = useState(occupancy || "");
  const inputRef = useRef(null);

  // Toggle functions
  const togglePropertyType = (type) => setSelectedPropertyType(type);
  const toggleBuildingType = (type) => {
    setSelectedBuildingType(type);
    dispatch(setPropertyIn(type));
  };
  const toggleSubPropertyType = (type) => {
    const validSubTypes = [
      "Apartment",
      "Independent Villa",
      "Independent House",
      "Plot",
      "Land",
      "Others",
    ];
    if (validSubTypes.includes(type)) {
      setSelectedSubPropertyType(type);
      dispatch(setSubType(type));
      // Reset bhk for Plot, Land, or Others
      if (["Plot", "Land", "Others"].includes(type)) {
        setSelectedBedrooms("");
        dispatch(setBHK(null)); // Set bhk to null in Redux
      }
    }
  };


  const toggleBedroom = (type) => {
    const validBHKs = [
      "1 BHK",
      "2 BHK",
      "3 BHK",
      "4 BHK",
      "5 BHK",
      "6 BHK",
      "7 BHK",
      "8 BHK",
    ];
    if (validBHKs.includes(type)) {
      setSelectedBedrooms(type);
      dispatch(setBHK(type)); 
    }
  }; 


  const toggleFurnishing = (type) => setSelectedFurnishing(type);
  const togglePostedBy = (type) => setSelectedPostedBy(type);
  const toggleAmenity = (type) =>
    setSelectedAmenities((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]
    );
    const togglePossession = (type) => {
      const validPossessionStatuses = ["Ready to Move", "Under Construction"];
      if (validPossessionStatuses.includes(type)) {
        setSelectedPossession(type);
        dispatch(setOccupancy(type)); 
      }
    };


  // Fetch cities
  useEffect(() => {
    const fetchCities = async () => {
      try {
        if (cities.length === 0) {
          const response = await fetch("https://api.meetowner.in/general/getcities");
          const data = await response.json();
          dispatch(setCities(data.cities || []));
        }
      } catch (error) {}
    };
    fetchCities();
    getUserLocation();
  }, [dispatch, cities.length]);

  // Get user location
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
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode.length > 0) {
        const city = geocode[0]?.city || "Unknown City";
        setUserLocation(city);
        dispatch(setDeviceLocation(city));
      }
    } catch (error) {
      dispatch(setDeviceLocation("Unknown City"));
    } finally {
      setLoading(false);
    }
  };

  // Update locations and set default city
  useEffect(() => {
    setLocations(cities);
    setFilteredLocations(cities);
    if (userLocation && cities.length > 0) {
      const matchedCity = cities.find(
        (city) => city.label.toLowerCase() === userLocation.toLowerCase()
      );
      if (matchedCity) {
        setSelectedLocation({ label: matchedCity.label, value: matchedCity.value });
      } else {
        setSelectedLocation(null);
      }
    }
  }, [cities, userLocation]);

  // Handle city search
  const handleCitySearch = (query) => {
    setSearchQuery(query);
    setFilteredLocations(
      query === ""
        ? locations
        : locations.filter((loc) => loc.label.toLowerCase().includes(query.toLowerCase()))
    );
  };

  // Handle city selection
  const handleCitySelect = (item) => {
    setSelectedLocation(item);
    onClose();
    setSearchQuery(""); // Clear search query after selection
  };

  // Render city item
  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleCitySelect(item)} style={styles.fullWidthItem}>
      <Text style={styles.fullWidthText}>{item.label}</Text>
    </TouchableOpacity>
  );

  // Back button handler
  useEffect(() => {
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
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [navigation]);


 
  const handlePropertiesLists = () => {
    navigation.navigate("PropertyList",);
  };

  
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* City Selection */}
        <View style={styles.shadowSection}>
        <View style={styles.locationSection}>
          <Text style={styles.locationLabel}>You are searching in</Text>
          <TouchableOpacity style={styles.cityButton} onPress={onOpen}>
            <HStack space={1} alignItems="center">
              <Text style={styles.cityText}>
                {selectedLocation?.label || "Select City"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="gray" />
            </HStack>
          </TouchableOpacity>
        </View>

        {/* Property Type Icons */}
        <View style={styles.propertyTypeIconsContainer}>
          <PropertyTypeIcon
            type="Buy"
            icon="home"
            selected={selectedPropertyType === "Buy"}
            onPress={() =>{
              dispatch(setSearchData({tab:"Buy"}))
              togglePropertyType("Buy")}}
            />
          
          <PropertyTypeIcon
            type="Rent"
            icon="key"
            selected={selectedPropertyType === "Rent"}
            onPress={() =>{
            dispatch(setSearchData({tab:"Rent"}))
             togglePropertyType("Rent")}}
          />
          <PropertyTypeIcon
            type="Plot"
            icon="map"
            selected={selectedPropertyType === "Plot"}
            onPress={() =>{
              dispatch(setSearchData({tab:"Plot"}))
                           togglePropertyType("Plot")}}
          />
          <PropertyTypeIcon
            type="Commercial"
            icon="building"
            selected={selectedPropertyType === "Commercial"}
            onPress={() =>{
              dispatch(setSearchData({tab:"Commercial"}))
              togglePropertyType("Commercial")}}
          />
        </View>
        </View>
        {/* Search Bar Section */}
        <SearchBarSection
          selectedCity={selectedLocation}
          setSearchQuery={setSearchQuery}
          setLocation={(location) => dispatch(setLocation(location))} // Pass setLocation
        />

        {/* Filter Sections */}
        <FilterSection title="Building Type">
          <View style={styles.filterOptionsRow}>
            <FilterOption
              label="Residential"
              selected={selectedBuildingType === "Residential"}
              onPress={() => toggleBuildingType("Residential")} // Calls toggleBuildingType
              checkmark={true}
            />
            <FilterOption
              label="Commercial"
              selected={selectedBuildingType === "Commercial"}
              onPress={() => toggleBuildingType("Commercial")} // Calls toggleBuildingType
              checkmark={true}
            />
          </View>
        </FilterSection>
        <FilterSection title="Property Type">
          <View style={styles.filterOptionsGrid}>
           
            <FilterOption
              label="Apartment"
              selected={selectedSubPropertyType === "Apartment"}
              onPress={() => toggleSubPropertyType("Apartment")}
            />
            <FilterOption
              label="Independent Villa"
              selected={selectedSubPropertyType === "Independent Villa"}
              onPress={() => toggleSubPropertyType("Independent Villa")}
            />
            <FilterOption
              label="Independent House"
              selected={selectedSubPropertyType === "Independent House"}
              onPress={() => toggleSubPropertyType("Independent House")}
            />
             <FilterOption
              label="Plot"
              selected={selectedSubPropertyType === "Plot"}
              onPress={() => toggleSubPropertyType("Plot")}
            />
            <FilterOption
              label="Land"
              selected={selectedSubPropertyType === "Land"}
              onPress={() => toggleSubPropertyType("Land")}
            />
            <FilterOption
              label="Others"
              selected={selectedSubPropertyType === "Others"}
              onPress={() => toggleSubPropertyType("Others")}
            />
          </View>
        </FilterSection>
        <FilterSection title="Bedrooms">
          <View style={styles.filterOptionsRow}>
            <FilterOption
              label="1 BHK"
              selected={selectedBedrooms === "1 BHK"}
              onPress={() => toggleBedroom("1 BHK")}
            />
            <FilterOption
              label="2 BHK"
              selected={selectedBedrooms === "2 BHK"}
              onPress={() => toggleBedroom("2 BHK")}
            />
            <FilterOption
              label="3 BHK"
              selected={selectedBedrooms === "3 BHK"}
              onPress={() => toggleBedroom("3 BHK")}
            />
            <FilterOption
              label="4 BHK"
              selected={selectedBedrooms === "4 BHK"}
              onPress={() => toggleBedroom("4 BHK")}
            />
          </View>
          <View style={styles.filterOptionsRow}>
            <FilterOption
              label="5 BHK"
              selected={selectedBedrooms === "5 BHK"}
              onPress={() => toggleBedroom("5 BHK")}
            />
            <FilterOption
              label="6 BHK"
              selected={selectedBedrooms === "6 BHK"}
              onPress={() => toggleBedroom("6 BHK")}
            />
            <FilterOption
              label="7 BHK"
              selected={selectedBedrooms === "7 BHK"}
              onPress={() => toggleBedroom("7 BHK")}
            />
            <FilterOption
              label="8 BHK"
              selected={selectedBedrooms === "8 BHK"}
              onPress={() => toggleBedroom("8 BHK")}
            />
          </View>
        </FilterSection>
        {/* <FilterSection title="Furnishing Status">
          <View style={styles.filterOptionsRow}>
            <FilterOption
              label="Furnished"
              selected={selectedFurnishing === "Furnished"}
              onPress={() => toggleFurnishing("Furnished")}
            />
            <FilterOption
              label="Semi-Furnished"
              selected={selectedFurnishing === "Semi-Furnished"}
              onPress={() => toggleFurnishing("Semi-Furnished")}
            />
          </View>
          <View style={styles.filterOptionsRow}>
            <FilterOption
              label="Unfurnished"
              selected={selectedFurnishing === "Unfurnished"}
              onPress={() => toggleFurnishing("Unfurnished")}
            />
            <FilterOption
              label="Gated"
              selected={selectedFurnishing === "Gated"}
              onPress={() => toggleFurnishing("Gated")}
            />
          </View>
        </FilterSection>
        <FilterSection title="Posted By">
          <View style={styles.filterOptionsRow}>
            <FilterOption
              label="Owner"
              selected={selectedPostedBy === "Owner"}
              onPress={() => togglePostedBy("Owner")}
            />
            <FilterOption
              label="Partner Agents"
              selected={selectedPostedBy === "Partner Agents"}
              onPress={() => togglePostedBy("Partner Agents")}
            />
          </View>
        </FilterSection>
        <FilterSection title="Amenities">
          <View style={styles.filterOptionsRow}>
            <FilterOption
              label="24*7 Security"
              selected={selectedAmenities.includes("24*7 Security")}
              onPress={() => toggleAmenity("24*7 Security")}
            />
            <FilterOption
              label="Central AC"
              selected={selectedAmenities.includes("Central AC")}
              onPress={() => toggleAmenity("Central AC")}
            />
          </View>
          <View style={styles.filterOptionsRow}>
            <FilterOption
              label="Visitor's Parking"
              selected={selectedAmenities.includes("Visitor's Parking")}
              onPress={() => toggleAmenity("Visitor's Parking")}
            />
            <FilterOption
              label="Club House"
              selected={selectedAmenities.includes("Club House")}
              onPress={() => toggleAmenity("Club House")}
            />
          </View>
          <View style={styles.filterOptionsRow}>
            <FilterOption
              label="Swimming Pool"
              selected={selectedAmenities.includes("Swimming Pool")}
              onPress={() => toggleAmenity("Swimming Pool")}
            />
            <FilterOption
              label="Power Backup"
              selected={selectedAmenities.includes("Power Backup")}
              onPress={() => toggleAmenity("Power Backup")}
            />
          </View>
          <View style={styles.filterOptionsRow}>
            <FilterOption
              label="Waiting/ Reception Room"
              selected={selectedAmenities.includes("Waiting/ Reception Room")}
              onPress={() => toggleAmenity("Waiting/ Reception Room")}
            />
          </View>
        </FilterSection> */}
        <FilterSection title="Possession Status">
          <View style={styles.filterOptionsRow}>
            <FilterOption
              label="Ready to Move"
              selected={selectedPossession === "Ready to Move"}
              onPress={() => togglePossession("Ready to Move")}
            />
            <FilterOption
              label="Under Construction"
              selected={selectedPossession === "Under Construction"}
              onPress={() => togglePossession("Under Construction")}
            />
          </View>
        </FilterSection>
        <View style={styles.bottomSpacing} />
      </ScrollView>

    
      <TouchableOpacity style={styles.fixedExploreButton} onPress={handlePropertiesLists}>
        <HStack alignItems="center" justifyContent="center" py={4}>
          <Ionicons name="compass-outline" size={20} color="purple" />
          <Text color="#1D3A76" ml={2}>
            <Text fontWeight="bold">View all properties</Text>
          </Text>
        </HStack>
      </TouchableOpacity>

      {/* City Selection Actionsheet */}
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
              onChangeText={handleCitySearch}
              style={styles.actionsheetInput}
              ref={inputRef}
            />
            <FlatList
              data={filteredLocations}
              keyExtractor={(item, index) => `${item.label}-${index}`}
              renderItem={renderItem}
              ListEmptyComponent={
                <Text style={{ textAlign: "center", color: "gray" }}>
                  No locations found
                </Text>
              }
              keyboardShouldPersistTaps="always"
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
    backgroundColor: "#FFFFFF",
  },
  shadowSection: {
    marginVertical: 20,
    marginHorizontal: 15,
    borderColor: "#E0E0E0",
    borderWidth: 0.5, 
    borderRadius: 20,
    backgroundColor: "#FFFFFF", 
    shadowColor: "#000000",
    shadowOffset: {
      width: 0, 
      height: 2, 
    },
    shadowOpacity: 0.06,
    shadowRadius: 110,
    elevation: 0.1, 
    overflow: "hidden", 
  },
  locationSection: {
    marginTop: 16,
    paddingHorizontal: 15,
  },
  locationLabel: {
    fontSize: 12,
    color: "#000",
    marginBottom: 4,
    fontFamily:'Poppins'
  },
  cityButton: {
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  cityText: {
    fontSize: 16,
    color: "#000",
    fontFamily: 'PoppinsSemiBold',
  },
  propertyTypeIconsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 16,
    paddingHorizontal: 15,
  },
  currentLocation: {
    justifyContent: "flex-end",
    alignItems: "flex-end",
    margin: 5,
    paddingHorizontal: 15,
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
  filterOptionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  filterOptionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
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
  bottomSpacing: {
    height: 100,
  },
});
