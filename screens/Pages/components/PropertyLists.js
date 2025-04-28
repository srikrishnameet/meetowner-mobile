import { useState, useCallback, useEffect, useRef, memo } from "react";
import {
  View,
  Text,
  FlatList,
  HStack,
  Image,
  Pressable,
  Spinner,
  IconButton,
  VStack,
  Box,
  Toast,
} from "native-base";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useDispatch, useSelector } from "react-redux";
import { setIntrestedProperties, setPropertyDetails } from "../../../store/slices/propertyDetails";
import config from "../../../config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BackHandler,StyleSheet,RefreshControl, TouchableOpacity } from "react-native";
import UserAvatar from "./propertyDetailsComponents/UserAvatar";
import WhatsAppIcon from '../../../assets/propertyicons/whatsapp.png';
import ApprovedIcon from '../../../assets/propertyicons/approved.png';
import SearchBarProperty from "./propertyDetailsComponents/SearchBarProperty";
import FilterBar from "./propertyDetailsComponents/FilterBar";
import debounce from "lodash/debounce";
import PropertyImage from "./propertyDetailsComponents/PropertyImage";

const userTypeMap = {
  3: "Builder",
  4: "Agent",
 5: "Owner",
  6: "Channel Partner",
};

const PropertyCard = memo(
  ({ item, onFav, onNavigate, userDetails,onShare,intrestedProperties, contactNow }) => {
    const area = item.builtup_area
      ? `${item.builtup_area} sqft`
      : `${item.length_area || 0} x ${item.width_area || 0} sqft`;

    const isInitiallyInterested = (intrestedProperties || [])?.some(
         (prop) =>
           prop === item?.unique_property_id
       );
       const [isLiked, setIsLiked] = useState(isInitiallyInterested);
       
       const handleFavClick = () => {
         onFav(item, !isLiked); // Pass the item and the new liked state
         setIsLiked((prev) => !prev); // Toggle local state
       };

    return (
      <View style={styles.containerVstack}>
        <Pressable onPress={() => onNavigate(item)}>
          <VStack alignItems="flex-start">
          <PropertyImage item={item} />
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.iconButton} onPress={handleFavClick}>
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={18}
                color={isLiked ? "#FE4B09" : "#fff"}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => onShare(item)}>
              <Ionicons name="share-social-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
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

const mapTabToPropertyFor = (tab) => {
  const mapping = {
    Buy: "Sell",
    Rent: "Rent",
    Plot: "Sell",
    Commercial: "Sell",
  };
  return mapping[tab] || "Sell"; // Default to "Sell" if tab is invalid
};

const formatToIndianCurrency = (value) => {
  if (value >= 10000000) return (value / 10000000).toFixed(2) + " Cr";
  if (value >= 100000) return (value / 100000).toFixed(2) + " L";
  if (value >= 1000) return (value / 1000).toFixed(2) + " K";
  return value.toString();
};

export default function PropertyLists({ route }) {
  const intrestedProperties  = useSelector((state) => state.property.intrestedProperties);
  const { prevSearch } = route.params || {};
  const [propertyLoading, setPropertyLoading] = useState(false);
  const maxLimit = 50;
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const flatListRef = useRef(null);
  const [properties, setProperties] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState(prevSearch || "");
  const [userDetails, setUserDetails] = useState(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const locationCacheRef = useRef({});
  const prefetchedUrlsRef = useRef(new Set());
    const [userInfo, setUserInfo] = useState("");

  const { tab, property_in, sub_type, bhk, occupancy, location, price } = useSelector(
    (state) => state.search
  );

  const [filters, setFilters] = useState({
    property_for: mapTabToPropertyFor(tab) || "Sell",
    property_in: property_in || "Residential",
    sub_type: sub_type || "Apartment",
    search: location || prevSearch || "",
    bedrooms: bhk || "",
    property_cost: "",
    priceFilter: price || "Relevance",
    occupancy: occupancy || "",
    property_status: 1,
  });

  // Update filters when Redux state changes
  useEffect(() => {
    const updatedFilters = {
      property_for: mapTabToPropertyFor(tab) || "Sell",
      property_in: property_in || (tab === "Commercial" ? "Commercial" : tab === "Plot" ? "" : "Residential"),
      sub_type: sub_type || (tab === "Plot" ? "Plot" : tab === "Commercial" ? "" : "Apartment"),
      bedrooms: bhk || "",
      occupancy: occupancy || "",
      search: location || prevSearch || "",
      priceFilter: price || "Relevance",
      property_cost: "",
      property_status: 1,
    };
    setFilters(updatedFilters);
    setSearchQuery(location || prevSearch || "");
    setPage(1);
    setProperties([]);
    fetchProperties(true, updatedFilters, location || prevSearch || "Hyderabad");
  }, [tab, property_in, sub_type, bhk, occupancy, location, price, prevSearch]);

  const preloadImages = useCallback((nextProperties) => {
    // Use ref directly to maintain Set instance
    const prefetchedUrls = prefetchedUrlsRef.current;

    // Prepare image URLs (limit to 4 properties)
    const imageUrls = nextProperties
      .slice(0, 4)
      .map((item) => {
        const imageUrl = item?.image && item.image.trim() !== ""
          ? `https://api.meetowner.in/uploads/${item.image}`
          : null;
        const placeholderUrl = `https://placehold.co/200x100@3x.png?text=${encodeURIComponent(item?.property_name || "Property")}`;
        return { imageUrl, placeholderUrl };
      })
      .filter((entry) => entry.imageUrl || entry.placeholderUrl);

    // Prefetch images in parallel with concurrency limit
    const prefetchImages = async () => {
      const prefetchPromises = imageUrls.map(async ({ imageUrl, placeholderUrl }) => {
        const urlToPrefetch = imageUrl && !prefetchedUrls.has(imageUrl) ? imageUrl : placeholderUrl;
        if (prefetchedUrls.has(urlToPrefetch)) return; // Skip if already prefetched

        try {
          await Image.prefetch(urlToPrefetch);
          prefetchedUrls.add(urlToPrefetch); // Mark as prefetched
        } catch (err) {
          console.warn(`Prefetch failed for ${urlToPrefetch}:`, err);
        }
      });

      // Limit concurrency to prevent network overload
      const concurrencyLimit = 2;
      for (let i = 0; i < prefetchPromises.length; i += concurrencyLimit) {
        await Promise.all(prefetchPromises.slice(i, i + concurrencyLimit));
      }
    };

    // Execute prefetching
    prefetchImages().catch((err) => console.warn("Error in prefetchImages:", err));
  }, []);
  
  const mapPriceFilterToApiValue = (priceFilter) => {
    const validFilters = ["Relevance", "Price: Low to High", "Price: High to Low", "Newest First"];
    return validFilters.includes(priceFilter) ? priceFilter : "Relevance";
  };

  const fetchProperties = useCallback(
    async (reset = false, appliedFilters = filters, searchedLocation) => {
      if (!hasMore && !reset) return;
      if (reset) setInitialLoading(true);
      else setPaginationLoading(true);
      setError(null);
      try {
        const storedDetails = await AsyncStorage.getItem("userdetails");
        if (!storedDetails) {
          setError("User details not found. Please log in.");
          return;
        }
        const parsedUserDetails = JSON.parse(storedDetails);
        setUserDetails(parsedUserDetails);

        const locationToSearch = (searchedLocation || appliedFilters.search || "Hyderabad").toLowerCase();
        const pageToFetch = reset ? 1 : page;

        // Create a cache key based on all filters
        const cacheKey = `${locationToSearch}_${JSON.stringify(appliedFilters)}`;
        if (locationCacheRef.current[cacheKey] && !reset && pageToFetch === 1) {
          setProperties(locationCacheRef.current[cacheKey]);
          setHasMore(true);
          preloadImages(locationCacheRef.current[cacheKey]);
          return;
        }

        const queryParams = new URLSearchParams({
          page: pageToFetch,
          property_for: appliedFilters.property_for || "Sell",
          property_in: appliedFilters.property_in || "",
          sub_type: appliedFilters.sub_type || "",
          search: locationToSearch,
          bedrooms: appliedFilters.bedrooms ? appliedFilters.bedrooms.replace(" BHK", "") : "",
          property_cost: appliedFilters.property_cost || "",
          priceFilter: encodeURIComponent(mapPriceFilterToApiValue(appliedFilters.priceFilter)),
          occupancy: appliedFilters.occupancy || "",
          property_status: "1",
        }).toString();

        console.log("Query Params:", queryParams);

        const url = `https://api.meetowner.in/listings/v1/getAllPropertiesByType?${queryParams}`;
        console.log("API URL:", url);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();

        if (data?.properties?.length > 0) {
          setProperties((prev) => {
            const newProperties = reset ? data.properties : [...prev, ...data.properties];
            preloadImages(data.properties);
            return newProperties;
          });
          setPage(pageToFetch + 1);
          setHasMore(data.current_page < data.total_pages);
          if (reset || pageToFetch === 1) {
            locationCacheRef.current[cacheKey] = data.properties;
          }
        } else {
          if (reset) setProperties([]);
          setHasMore(false);
        }
      } catch (error) {
        console.error("Error fetching properties:", error);
        setError("Failed to load properties. Please try again.");
        if (reset) setProperties([]);
        setHasMore(false);
      } finally {
        setInitialLoading(false);
        setPaginationLoading(false);
        if (reset) setRefreshing(false);
      }
    },
    [page, hasMore, preloadImages]
  );

  useEffect(() => {
    const getData = async () => {
      try {
        const data = await AsyncStorage.getItem("userdetails");
        if (data) {
          const parsedUserDetails = JSON.parse(data);
       
          setUserInfo(parsedUserDetails);
          await fetchIntrestedProperties(parsedUserDetails); // Call with user details
        } else {
          console.warn("No user details found in AsyncStorage");
        }
        fetchProperties(true, filters, location || prevSearch || "Hyderabad");
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };
    getData();
   
  }, []);

   const handleInterestAPI = async (property, isAlreadyLiked) => {
      if (!userInfo) {
        Toast.show({
          placement: "top-right",
          render: () => (
            <Box bg="yellow.300" px="2" py="1" mr={5} rounded="sm" mb={5}>
              Please log in to save property!
            </Box>
          ),
        });
        return;
      }
  
      // Optimistically update Redux state
      const propertyId = property.unique_property_id;
      dispatch(
        setIntrestedProperties(
          isAlreadyLiked
            ? intrestedProperties.filter((id) => id !== propertyId)
            : [...intrestedProperties, propertyId]
        )
      );
      const payload = {
        User_user_id: userInfo.user_id,
        userName: userInfo.name,
        userEmail: userInfo?.email || "N/A",
        userMobile: userInfo.mobile,
        ...property,
        status: isAlreadyLiked ? 1 : 0, 
      };
      console.log("payload: ", payload);

      try {
        const res =  await axios.post(`${config.awsApiUrl}/fav/v1/postIntrest`, payload);
        await fetchIntrestedProperties(userInfo);
        Toast.show({
          placement: "top-right",
          render: () => (
            <Box bg="green.300" px="2" py="1" mr={5} rounded="sm" mb={5}>
              {isAlreadyLiked ? "Removed from favorites" : "Added to favorites"}
            </Box>
          ),
        });
      } catch (error) {
        console.error("Error posting interest:", error);
       
        dispatch(
          setIntrestedProperties(
            isAlreadyLiked
              ? [...intrestedProperties, propertyId]
              : intrestedProperties.filter((id) => id !== propertyId)
          )
        );
        Toast.show({
          placement: "top-right",
          render: () => (
            <Box bg="red.300" px="2" py="1" mr={5} rounded="sm" mb={5}>
              Failed to update favorite. Please try again.
            </Box>
          ),
        });
      }
    };
  
  const fetchIntrestedProperties = async (userInfo) => {
    try {
      if (!userInfo?.user_id) {
        console.warn("User ID not found in userInfo:", userInfo);
        return;
      }
      const response = await axios.get(
        `${config.awsApiUrl}/fav/v1/getAllFavourites?user_id=${userInfo.user_id}`
      );
      const liked = response.data.favourites || [];
      const likedIds = liked.map((fav) => fav.unique_property_id);
      dispatch(setIntrestedProperties(likedIds));
    } catch (error) {
      console.error("Error fetching interested properties:", error);
      
    }
  };

 

  const getOwnerDetails = async (unique_property_id) => {
    try {
      const response = await fetch(
        `https://api.meetowner.in/listings/getsingleproperty?unique_property_id=${unique_property_id}`
      );
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      return data.property_details?.seller_details || {};
    } catch (error) {
      console.error("Error fetching owner details:", error);
      return {};
    }
  };

  const handleAPI = async (item) => {
    const owner = await getOwnerDetails(item.unique_property_id);
    const payload = {
      channelId: "67a9e14542596631a8cfc87b",
      channelType: "whatsapp",
      recipient: { name: owner?.name || "Unknown", phone: `91${owner?.mobile}` },
      whatsapp: {
        type: "template",
        template: {
          templateName: "leads_information_for_partners_clone",
          bodyValues: {
            name: userDetails?.name || "User",
            phone: userDetails?.mobile || "",
            variable_3: item?.sub_type || "Property",
            variable_4: item?.property_name || "N/A",
            variable_5: item?.google_address?.split(",")[0]?.trim() || "N/A",
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
      await axios.post("https://server.gallabox.com/devapi/messages/whatsapp", payload, { headers });
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
      Toast.show({
        placement: "top-right",
        render: () => (
          <Box bg="red.300" px="2" py="1" mr={5} rounded="sm" mb={5}>
            Failed to send WhatsApp message.
          </Box>
        ),
      });
    }
  };

  const handleFavourites = useCallback(
    async ( item, action) => {
      try {
        // await handleAPI(item);
        await handleInterestAPI(item, action);
        
      } catch (error) {
        console.error("Error in handleFavourites:", error);
        Toast.show({
          placement: "top-right",
          render: () => (
            <Box bg="red.300" px="2" py="1" mr={5} rounded="sm" mb={5}>
              Failed to add favourite.
            </Box>
          ),
        });
      }
    },
    [userDetails]
  );

    const shareProperty = async (property) => {
      try {
        await Share.share({
          title: property.name || 'Check out this property!',
          message: `${property.name}\nLocation: ${property.location}\nhttps://api.meetowner.in/property?unique_property_id=${property.unique_property_id}`,
          url: `https://api.meetowner.in/property?unique_property_id=${property.unique_property_id}`,
        });
        
      } catch (error) {
        console.error("Error sharing property:", error);
      }
    };
  
    const handleShare = useCallback((item) => {
      shareProperty(item);
    }, []);

  const handleNavigate = useCallback(
    (item) => {
      dispatch(setPropertyDetails(item));
      navigation.navigate("PropertyDetails");
    },
    [navigation, dispatch]
  );

  const getItemLayout = useCallback(
    (_, index) => ({
      length: 300,
      offset: 300 * index,
      index,
    }),
    []
  );

  const contactNow = (item) => {
    setSelectedItem(item);
    setSelectedPropertyId(item);
    setModalVisible(true);
  };

  const handleSubmit = (formData) => {
    setModalVisible(false);
    setSelectedItem(null);
  };

  const renderPropertyCard = useCallback(
    ({ item }) => (
      <PropertyCard
        item={item}
        onFav={handleFavourites}
        onNavigate={handleNavigate}
        userDetails={userDetails}
        onShare={() => handleShare(item)}
        intrestedProperties={intrestedProperties}
        contactNow={contactNow}
      />
    ),
    [handleFavourites, handleNavigate, userDetails,intrestedProperties]
  );

  const handleScroll = useCallback((event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollToTop(offsetY > 100);
  }, []);

  const scrollToTop = useCallback(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
      setShowScrollToTop(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setProperties([]);
    fetchProperties(true, filters, searchQuery || prevSearch || "Hyderabad");
  }, [filters, prevSearch, fetchProperties]);

  const loadMoreProperties = useCallback(() => {
    if (!paginationLoading && hasMore) {
      fetchProperties(false);
    }
  }, [paginationLoading, hasMore, fetchProperties]);

  const handleLocationSearch = useCallback(
    (query) => {
      setSearchQuery(query);
      setPage(1);
      setProperties([]);
      fetchProperties(true, filters, query || "Hyderabad");
    },
    [filters, fetchProperties]
  );

  return (
    <View style={styles.container}>
      <SearchBarProperty
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleLocationSearch={handleLocationSearch}
        fetchProperties={fetchProperties}
        filters={filters}
        setFilters={setFilters}
        selectedCity="Hyderabad"
      />
      <FilterBar />
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : initialLoading ? (
        <View style={styles.loadingContainer}>
          <Spinner size="lg" color="#1D3A76" />
          <Text style={styles.loadingText}>Loading Properties...</Text>
        </View>
      ) : properties.length > 0 ? (
        <FlatList
          ref={flatListRef}
          data={properties}
          keyExtractor={(item) => item.unique_property_id}
          renderItem={renderPropertyCard}
          onEndReached={loadMoreProperties}
          onEndReachedThreshold={0.7}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          initialNumToRender={10}
          maxToRenderPerBatch={50}
          windowSize={21}
          updateCellsBatchingPeriod={50}
          getItemLayout={getItemLayout}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1D3A76"]} />
          }
          ListFooterComponent={
            paginationLoading ? (
              <View style={styles.loaderContainer}>
                <Spinner size="small" color="#1D3A76" />
              </View>
            ) : !hasMore && properties.length > 0 ? (
              <View style={styles.footerContainer}>
                <Text style={styles.footerText}>No More Properties</Text>
              </View>
            ) : null
          }
        />
      ) : (
        <View style={styles.noPropertiesContainer}>
          <Text style={styles.noPropertiesText}>No properties found</Text>
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
  noPropertiesContainer:{
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
    paddingHorizontal: 15,
  },
  noPropertiesText:{
    color: "#000",
    fontFamily: 'PoppinsSemiBold',
    fontSize: 14,
  },
  actionButtons: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "column",
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});
