import React, { useState, useCallback, useEffect, useRef, memo } from "react";
import {
  ScrollView,
  TouchableOpacity,
  Platform,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  View,
  Text,
  FlatList,
  HStack,
  Image,
  Pressable,
  Spinner,
  IconButton,
  Actionsheet,
  useDisclose,
  VStack,
  Box,
  Toast,
} from "native-base";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { addFavourite } from "../../../store/slices/favourites";
import { setPropertyDetails } from "../../../store/slices/propertyDetails";
import config from "../../../config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BackHandler } from "react-native";
import UserAvatar from "./propertyDetailsComponents/UserAvatar";
import WhatsAppIcon from '../../../assets/propertyicons/whatsapp.png';
import ApprovedIcon from '../../../assets/propertyicons/approved.png';
import SearchBarProperty from "./propertyDetailsComponents/SearchBarProperty";
import ContactActionSheet from "./propertyDetailsComponents/ContactActionSheet";
import FilterBar from "./propertyDetailsComponents/FilterBar";

const userTypeMap = {
  3: "Builder",
  4: "Agent",
 5: "Owner",
  6: "Channel Partner",
};

const PropertyCard = memo(
  ({ item, onFav, onNavigate, userDetails, contactNow }) => {
    const area = item.builtup_area
      ? `${item.builtup_area} sqft`
      : `${item.length_area || 0} x ${item.width_area || 0} sqft`;

    const handleFavClick = async (type, item, action) => {
      await onFav(type, item, action);
    };

    return (
      <View style={styles.containerVstack}>
        <Pressable onPress={() => onNavigate(item)}>
          <VStack alignItems="flex-start">
            <Image
              source={{
                uri:
                  item?.image && item.image.trim() !== ""
                    ? `https://api.meetowner.in/uploads/${item.image}`
                    : `https://placehold.co/200x100@3x.png?text=${item?.property_name}`,
              }}
              alt="Property Image"
              w={400}
              h={200}
              resizeMode="cover"
              style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
            />
            <HStack>
              <Text style={styles.possesionText}>
                {item?.occupancy === 'Ready to move'
                  ? 'Ready to move'
                  : item?.under_construction
                  ? `Possession by ${new Date(item.under_construction).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}`
                  : 'N/A'}
              </Text>
              <Text style={styles.possesionText}>|</Text>
              <Text style={styles.possesionText}>{area}</Text>
            </HStack>
            <VStack style={styles.contentContainer}>
              <HStack justifyContent="space-between" alignItems="center">
                <Text style={styles.propertyText}>
                  {item.property_name || "N/A"}
                </Text>
                <HStack space={1} alignItems="center" px={2} py={0.5} justifyContent="center">
                  <Image alt="approve" source={ApprovedIcon} size={18} color="green" />
                  <Text fontSize="12" style={{ fontFamily: 'PoppinsSemiBold' }} color="green.600" thin>
                    {"Verified"}
                  </Text>
                </HStack>
              </HStack>
              <HStack justifyContent={"space-between"} space={1} alignItems="center">
                <Text style={styles.propertyText}>
                  ₹ {formatToIndianCurrency(item.property_cost || 0)}
                </Text>
              </HStack>
              <Text style={styles.propertyText}>
                {item.property_in || "N/A"} | {item.sub_type || "N/A"}
              </Text>
            </VStack>
          </VStack>
        </Pressable>
        <HStack
          justifyContent="space-between"
          space={2}
          py={3}
          mb={1.5}
          px={2}
          style={{ borderTopWidth: 2, borderTopColor: "#f5f5f5" }}
          alignItems="center"
        >
          <Box flex={0.20} alignItems="flex-start">
            <UserAvatar item={item} size={24} />
          </Box>
          <VStack flex={0.5} justifyContent="center">
            <Text style={styles.username} numberOfLines={2} ellipsizeMode="tail">
              {item?.user?.name || "Unknown"}
            </Text>
            <Text style={styles.userType}>{userTypeMap[item?.user?.user_type] || "Unknown"}</Text>
          </VStack>
          <Pressable style={styles.whatsbuttonStyles} flex={0.25}>
            <HStack space={1} alignItems="center" justifyContent="center">
              <Image
                source={WhatsAppIcon}
                alt="WhatsApp Icon"
                width={5}
                height={5}
                resizeMode="contain"
              />
              <Text style={styles.WhatsbuttonsText}>Chat</Text>
            </HStack>
          </Pressable>
          <Pressable
            style={styles.buttonStyles}
            flex={0.25}
            onPress={() => {
              console.log("clicked");
              contactNow(item);
            }}
          >
            <Text style={styles.buttonsText}>Contact</Text>
          </Pressable>
        </HStack>
      </View>
    );
  }
);

const formatToIndianCurrency = (value) => {
  if (value >= 10000000) return (value / 10000000).toFixed(2) + " Cr";
  if (value >= 100000) return (value / 100000).toFixed(2) + " L";
  if (value >= 1000) return (value / 1000).toFixed(2) + " K";
  return value.toString();
};

export default function PropertyLists({ route }) {
  const { prevSearch } = route.params || {};
  const dispatch = useDispatch();
  const flatListRef = useRef(null);
  const navigation = useNavigation();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [propertyLoading, setPropertyLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const maxLimit = 50;

  const { isOpen: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclose();
  const [userDetails, setUserDetails] = useState(null);

  const [filters, setFilters] = useState({
    property_for: "",
    property_type: "",
    bedrooms: "",
    possession_status: "",
    min_price_range: 1000,
    max_price_range: 30000000,
  });

  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const locationCacheRef = useRef({});

  const fetchProperties = useCallback(
    async (reset = false, appliedFilters = filters, searchedLocation) => {
      if (!hasMore && !reset) return;
      setPropertyLoading(true);
      try {
        const storedDetails = await AsyncStorage.getItem("userdetails");
        if (!storedDetails) {
          setPropertyLoading(false);
          return;
        }
        const parsedUserDetails = JSON.parse(storedDetails);
        setUserDetails(parsedUserDetails);
        const locationToSearch = (searchedLocation || prevSearch || "Hyderabad").toLowerCase();
        const pageToFetch = reset ? 1 : page;

        if (locationCacheRef.current[locationToSearch] && !reset && pageToFetch === 1) {
          setProperties(locationCacheRef.current[locationToSearch].slice(0, maxLimit));
          setHasMore(true);
          setPropertyLoading(false);
          return;
        }

        const queryParams = new URLSearchParams({
          page: pageToFetch,
          property_for: appliedFilters.property_for
            ? appliedFilters.property_for === "Buy"
              ? "Sell"
              : appliedFilters.property_for
            : "Sell",
          property_in: appliedFilters.building_type || "Residential",
          sub_type: appliedFilters.property_type || "Apartment",
          search: locationToSearch,
          bedrooms: appliedFilters.bedrooms ? appliedFilters.bedrooms.replace(" BHK", "") : "",
          property_cost: appliedFilters.max_price_range || "",
          priceFilter: appliedFilters.sort || "Relevance",
          occupancy: appliedFilters.possession_status || "",
          property_status: "1",
        }).toString();

        const url = `https://api.meetowner.in/listings/v1/getAllPropertiesByType?${queryParams}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data?.properties?.length > 0) {
          setProperties((prev) => {
            const combined = reset ? data.properties : [...prev, ...data.properties];
            return combined.slice(0, maxLimit);
          });
          setPage(pageToFetch + 1);
          setHasMore(data.current_page < data.total_pages && properties.length < maxLimit);
          if (reset || pageToFetch === 1) {
            locationCacheRef.current[locationToSearch] = data.properties;
          }
        } else {
          if (reset) setProperties([]);
          setHasMore(false);
        }
      } catch (error) {
        console.error("Error fetching properties:", error);
        if (reset) setProperties([]);
        setHasMore(false);
      } finally {
        setPropertyLoading(false);
        if (reset) setRefreshing(false);
      }
    },
    [filters, page, prevSearch, hasMore, properties.length]
  );

  useEffect(() => {
    setSearchQuery(prevSearch || "");
    fetchProperties(true, filters, prevSearch || "Hyderabad");
  }, [prevSearch, filters, fetchProperties]);

  useEffect(() => {
    const interval = setInterval(() => {
      onRefresh();
    }, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleInterestAPI = async (unique_property_id, action) => {
    try {
      const url = `${config.mainapi_url}/favourites_exe.php?user_id=${userDetails?.user_id}&unique_property_id=${unique_property_id}&action=0&intrst=1&name=${userDetails?.name}&mobile=${userDetails?.mobile}&email=${userDetails?.email}`;
      await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      });
      await fetch(
        `${config.mainapi_url}/favourites_exe?user_id=${userDetails.user_id}&unique_property_id=${unique_property_id}&intrst=1&action=${action}`
      );
    } catch (error) {
      Toast.show({
        placement: "top-right",
        render: () => (
          <Box bg="red.300" px="2" py="1" mr={5} rounded="sm" mb={5}>
            Something went wrong. Please try again.
          </Box>
        ),
      });
    }
  };

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

  const handleMetrics = async (property, type) => {
    await axios.post("https://api.meetowner.in/metrics/saveAnalytics", {
      user_id: userDetails?.user_id || "",
      user_name: userDetails?.name || "",
      mobile_number: userDetails?.mobile || "",
      location: property?.google_address || "N/A",
      searched_query: property?.property_name || "N/A",
      unique_property_id: property?.unique_property_id || "N/A",
      userContacts: "",
      intrest_type: type || "",
      created_at: "",
    });
  };

  const [owner, setOwner] = useState("");

  const getOwnerDetails = async () => {
    const response = await fetch(
      `https://api.meetowner.in/listings/getsingleproperty?unique_property_id=${selectedPropertyId?.unique_property_id}`
    );
    const data = await response.json();
    const propertydata = data.property_details;
    const sellerdata = propertydata.seller_details;
    if (response.status === 200) {
      setOwner(sellerdata);
    }
  };

  const handleAPI = async () => {
    await getOwnerDetails();
    const payload = {
      channelId: "67a9e14542596631a8cfc87b",
      channelType: "whatsapp",
      recipient: { name: owner?.name, phone: `91${owner?.mobile}` },
      whatsapp: {
        type: "template",
        template: {
          templateName: "leads_information_for_partners_clone",
          bodyValues: {
            name: userDetails?.name,
            phone: userDetails?.mobile,
            variable_3: selectedPropertyId?.property_subtype || selectedPropertyId?.sub_type || "Property",
            variable_4: selectedPropertyId?.property_name,
            variable_5: selectedPropertyId?.google_address.split(",")[0].trim(),
          },
        },
      },
    };
    const headers = {
      apiKey: "67e3a37bfa6fbc8b1aa2edcf",
      apiSecret: "a9fe1160c20f491eb00389683b29ec6b",
      "Content-Type": "application/json",
    };
    try {
      const url = "https://server.gallabox.com/devapi/messages/whatsapp";
      const response = await axios.post(url, payload, { headers });
      Toast.show({
        duration: 1000,
        placement: "top-right",
        render: () => (
          <Box bg="green.300" px="2" py="1" mr={5} rounded="sm" mb={5}>
            Details submitted successfully.
          </Box>
        ),
      });
    } catch (error) {
      console.error("Error in handleAPI:", error);
    }
  };

  const handleIntrests = async (type, property, userDetails) => {
    await handleMetrics(property, userDetails, type);
  };

  const handleFavourites = useCallback(async (type, item, action) => {
    try {
      await handleAPI();
      await handleInterestAPI(item.unique_property_id, action);
      await handleIntrests(type, item, userDetails);
    } catch (error) {
      console.error("Error in handleFavourites:", error);
    }
  }, [userDetails]);

  const handleNavigate = useCallback(
    (item) => {
      dispatch(setPropertyDetails(item));
      navigation.navigate("PropertyDetails");
    },
    [navigation, dispatch]
  );

  const getItemLayout = (_, index) => ({
    length: 180,
    offset: 180 * index,
    index,
  });

  const contactNow = (item) => {
    setSelectedItem(item);
    setSelectedPropertyId(item);
    setModalVisible(true);
  };

  const handleSubmit = (formData) => {
    console.log("Submitted Details:", formData, "for item:", selectedItem);
    setModalVisible(false);
    setSelectedItem(null);
  };

  const renderPropertyCard = useCallback(
    ({ item }) => (
      <PropertyCard
        item={item}
        onPress={() => handleNavigate(item)}
        onFav={(type, item, action) => {
          setSelectedPropertyId(item);
          handleFavourites(type, item, action);
        }}
        onNavigate={() => handleNavigate(item)}
        userDetails={userDetails}
        contactNow={contactNow}
      />
    ),
    [handleFavourites, handleNavigate, userDetails]
  );

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 100 && !showScrollToTop) {
      setShowScrollToTop(true);
    } else if (offsetY <= 0 && showScrollToTop) {
      setShowScrollToTop(false);
    }
  };

  const scrollToTop = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
      setShowScrollToTop(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchProperties(true);
  };

  const loadMoreProperties = () => {
    if (hasMore && !propertyLoading && properties.length < maxLimit) {
      fetchProperties(false, filters, searchQuery || prevSearch || "Hyderabad");
    }
  };

  const handleLocationSearch = (query) => {
    setSearchQuery(query);
    fetchProperties(true, filters, query);
  };

  return (
    <View style={styles.container}>
      <View style={{ width: "100%", position: "relative" }}>
        <SearchBarProperty
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleLocationSearch={handleLocationSearch}
          fetchProperties={fetchProperties}
          filters={filters}
          setFilters={setFilters}
        />
        <FilterBar />
      </View>

      {propertyLoading ? (
        <View style={styles.loadingContainer}>
          <Spinner size="lg" color="#1D3A76" />
          <Text style={styles.loadingText}>Loading Properties...</Text>
        </View>
      ) : properties?.length > 0 ? (
        <FlatList
          ref={flatListRef}
          data={properties}
          keyExtractor={(item, index) => `${item.unique_property_id}-${index}`}
          renderItem={renderPropertyCard}
          onEndReached={loadMoreProperties}
          onEndReachedThreshold={0.3}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={30}
          windowSize={10}
          removeClippedSubviews={true}
          getItemLayout={getItemLayout}
          ListFooterComponent={
            properties.length >= maxLimit ? (
              <View style={styles.footerContainer}>
                <Text style={styles.searchMoreText}>Please Search For More Properties</Text>
              </View>
            ) : propertyLoading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="small" color="#1D3A76" />
              </View>
            ) : null
          }
        />
      ) : (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>
            No Properties found! {filters?.property_type || searchQuery.split(",")[0].trim()}!
          </Text>
        </View>
      )}
      {showScrollToTop && (
        <IconButton
          position="absolute"
          bottom={85}
          right={5}
          bg="white"
          borderRadius="full"
          shadow={3}
          icon={<Ionicons name="arrow-up" size={24} color="#1D3A76" />}
          onPress={scrollToTop}
        />
      )}
      <ContactActionSheet
        isOpen={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedItem(null);
        }}
        onSubmit={handleSubmit}
        userDetails={userDetails}
        title="Contact Now"
        type="contact"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingTop: 2,
  },
  containerVstack: {
    borderRadius: 20,
    backgroundColor: "#ffffff",
    margin: 10,
    overflow: "hidden",
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  propertyText: {
    color: "#000",
    fontFamily: 'PoppinsSemiBold',
    fontSize: 14,
  },
  searchMoreText: {
    color: "#000",
    fontFamily: 'PoppinsSemiBold',
    fontSize: 14,
  },
  username: {
    color: "#7C7C7C",
    fontFamily: 'Poppins',
    fontSize: 10,
  },
  userType: {
    color: "#7C7C7C",
    fontFamily: 'Poppins',
    fontSize: 10,
  },
  possesionText: {
    fontSize: 14,
    fontFamily: 'PoppinsSemiBold',
    color: '#7C7C7C',
    margin: 5,
  },
  contentContainer: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  buttonStyles: {
    backgroundColor: "#1D3A76",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 30,
  },
  whatsbuttonStyles: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 30,
    borderColor: '#25D366',
    borderWidth: 1,
  },
  buttonsText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'Poppins',
  },
  WhatsbuttonsText: {
    color: "#000",
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'Poppins',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "bold",
    color: "#1D3A76",
  },
  footerContainer: {
    padding: 20,
    alignItems: "center",
  },
});