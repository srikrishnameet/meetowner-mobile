import React, { useEffect, useState, useCallback, useRef, memo } from "react";
import {
  Share,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  View,
  Text,
  Image,
} from "react-native";
import {
  FlatList,
  HStack,
  Text as NBText,
  View as NBView,
  Actionsheet,
  useDisclose,
  Box,
  Toast,
} from "native-base";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSelector, useDispatch } from "react-redux";
import {
  setIntrestedProperties,
  setTrendingProjects,
  setPropertyDetails,
} from "../../../store/slices/propertyDetails";
import config from "../../../config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import ShareDetailsModal from "./ShareDetailsModal";
import { Modal, TouchableWithoutFeedback } from "react-native";
import direction from '../../../assets/propertyicons/direction.png';
import location from '../../../assets/propertyicons/location.png';
import parking from '../../../assets/propertyicons/parking.png';
import shower from '../../../assets/propertyicons/shower.png';
import yards from '../../../assets/propertyicons/yards.png';
import bhk from '../../../assets/propertyicons/bhk.png';

const PropertyCard = memo(
  ({ item, onPress, onFav, onShare, intrestedProperties, enquireNow, isHighlighted = false }) => {
    const isInitiallyInterested = (intrestedProperties || [])?.some(
      (prop) =>
        prop?.property_details?.unique_property_id === item?.unique_property_id
    );
    const [isLiked, setIsLiked] = useState(isInitiallyInterested);
  
    const handleFavClick = () => {
      onFav(item, !isLiked);
      setIsLiked((prev) => !prev);
    };
  
    // Map item properties to the example's property object structure
    const property = {
      image: `https://api.meetowner.in/uploads/${item?.image || "https://placehold.co/600x400"}`,
      title: item?.property_name || "N/A",
      price: item?.property_cost ? formatToIndianCurrency(item?.property_cost) : "N/A",
      location: item?.google_address || "N/A",
      area: item?.area || "N/A",
      facing: item?.facing || "N/A",
      forSale: item?.property_for === "Sell",
      bedrooms: item?.bedrooms || "N/A",
      bathrooms: item?.bathrooms || "N/A",
      car_parking: item?.car_parking || "N/A",
    };
  
  
    return (
      <TouchableOpacity
      activeOpacity={1} 
        onPress={() => onPress && onPress(item)}
       >
      <View style={styles.cardContainer}>
       
        {/* Image Container - Left Side */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: property.image }} style={styles.image} />
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.iconButton} onPress={handleFavClick}>
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={18}
                color="#fff"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => onShare(item)}>
              <Ionicons name="share-social-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Details Container - Right Side */}
        <View style={styles.detailsContainer}>
          <Text style={styles.title} numberOfLines={1}>{property.title}</Text>
          <View style={styles.locationContainer}>
            <Image source={location}
              style={{ width: 12, height: 12,}} />
            <Text style={styles.locationText} numberOfLines={1}>{property.location}</Text>
          </View>
          <View style={styles.featuresContainer}>
           
            <View style={styles.featureItem}>
              <View style={styles.directionIcon}>
                <Image source={direction}
                                     style={{ width: 12, height: 12,}} />
              </View>
              <Text style={styles.featureText}>{property.facing}</Text>
            </View>
            <View style={styles.featureItem}>
              <Image source={bhk}
                style={{ width: 12, height: 12,}} />
              <Text style={styles.featureText}>
                {property.bedrooms !== "N/A" ? `${property.bedrooms} BHK` : "BHK"}
              </Text>
            </View>
          </View>
          <View style={styles.secondRowFeatures}>
            <View style={styles.featureItem}>
               <Image source={shower}
                    style={{ width: 12, height: 12,}} />
              <Text style={styles.featureText}>Bathrooms</Text>
            </View>
            <View style={styles.featureItem}>
              <Image source={parking}
                  style={{ width: 12, height: 12,}} />
              <Text style={styles.featureText}>Parking</Text>
            </View>
          </View>
          <View style={styles.bottomContainer}>
            <TouchableOpacity
              style={styles.enquireButton}
              onPress={() => enquireNow(item)}
            >
              <Text style={styles.enquireButtonText}>Enquire Now</Text>
            </TouchableOpacity>
          </View>
        </View>

       
      </View>
      </TouchableOpacity>
    );
  }
);
   

const formatToIndianCurrency = (value) => {
  if (!value || isNaN(value)) return "N/A";
  const numValue = parseFloat(value);
  if (numValue >= 10000000) return (numValue / 10000000).toFixed(2) + " Cr";
  if (numValue >= 100000) return (numValue / 100000).toFixed(2) + " L";
  if (numValue >= 1000) return (numValue / 1000).toFixed(2) + " K";
  return numValue.toString();
};

export default function BestDealProperties({ activeTab }) {
  const intrests = useSelector((state) => state.property.intrestedProperties);
  const dispatch = useDispatch();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
 
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const flatListRef = useRef(null);
  const navigation = useNavigation();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [type, setType] = useState("");

  const [userInfo, setUserInfo] = useState("");

  const fetchProperties = useCallback(
     async (reset = true) => {
       setLoading(true);
       try {
         const response = await fetch(
           "https://api.meetowner.in/listings/v1/getBestDeals"
         );
         const data = await response.json();
       
         if (data.results && data.results.length > 0) {
           const newProperties = reset
             ? data.results
             : [...properties, ...data.results];
           setProperties(newProperties);
          
         } else {
           setHasMore(false);
         }
       } catch (error) {
         console.error("Error fetching properties:", error);
       } finally {
         setLoading(false);
         if (reset) setRefreshing(false);
       }
     },
     [activeTab, properties]
   );

  const handleInterestAPI = async (unique_property_id, action) => {
    try {
      const url = `${config.mainapi_url}/favourites_exe.php?user_id=${userInfo.user_id}&unique_property_id=${unique_property_id}&action=${action}&intrst=1&name=${userInfo?.name}&mobile=${userInfo?.mobile}&email=${userInfo?.email}`;
      await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      });
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

  const handleMetrics = async (property, type) => {
    try {
      await axios.post("https://api.meetowner.in/metrics/saveAnalytics", {
        user_id: userInfo?.user_id || "",
        user_name: userInfo?.name || "",
        mobile_number: userInfo?.mobile || "",
        location: property?.google_address || "N/A",
        searched_query: property?.property_name || "N/A",
        unique_property_id: property?.unique_property_id || "N/A",
        userContacts: "",
        intrest_type: type || "",
        created_at: "",
      });
    } catch (error) {
      console.error("Error saving analytics:", error);
    }
  };

  const handleIntrests = async (type, property, userInfo) => {
    await handleMetrics(property, type);
  };

  const fetchIntrestedProperties = async () => {
    try {
      const response = await fetch(
        `https://meetowner.in/Api/newapi?fetchtype=interested_property_fetch&user_id=${userInfo?.user_id}`
      );
      const data = await response.json();
      if (response.status === 200) {
        dispatch(setIntrestedProperties(data.data));
      }
    } catch (error) {
      console.error("Error fetching interested properties:", error);
    }
  };

  useEffect(() => {
    const getData = async () => {
      const data = await AsyncStorage.getItem("userdetails");
      const parsedUserDetails = JSON.parse(data);
      setUserInfo(parsedUserDetails);
    };
    getData();
    fetchProperties(true);
    fetchIntrestedProperties();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchProperties(true);
    }, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const shareProperty = async (property) => {
    try {
      await Share.share({
        message: `https://api.meetowner.in/property?unique_property_id=${property.unique_property_id}`,
      });
      await handleIntrests("shared", property, userInfo);
    } catch (error) {
      console.error("Error sharing property:", error);
    }
  };

  const handleFavourites = useCallback(
    async (item, isLiked) => {
      try {
        const action = isLiked ? 0 : 1;
        await handleInterestAPI(item.unique_property_id, action);
        await handleIntrests("favourites", item, userInfo);
      } catch (error) {
        console.error("Error handling favourites:", error);
      }
    },
    [userInfo]
  );

  const handleShare = useCallback((item) => {
    shareProperty(item);
  }, []);

  const handleNavigate = useCallback((item) => {
    dispatch(setPropertyDetails(item));
    navigation.navigate("PropertyDetails");
  }, [dispatch, navigation]);

  const handlePropertiesLists = useCallback(() => {
    navigation.navigate("PropertyList", { activeTab });
  }, [navigation, activeTab]);

  const renderPropertyCard = useCallback(
    ({ item }) => {
      if (!item || !item.unique_property_id) {
        return null;
      }
      const isLiked = intrests?.some(
        (prop) =>
          prop?.property_details?.unique_property_id ===
          item?.unique_property_id
      );
      return (
        <PropertyCard
          item={item}
          onPress={() => handleNavigate(item)}
          onFav={(item, isLiked) => handleFavourites(item, isLiked)}
          onShare={() => handleShare(item)}
          isLiked={isLiked}
          intrestedProperties={intrests}
          enquireNow={() => {
            setType("enquireNow");
            setSelectedPropertyId(item);
            setModalVisible(true);
          }}
          isHighlighted={false}
        />
      );
    },
    [handleFavourites, handleShare, handleNavigate, intrests]
  );

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 100 && !showScrollToTop) {
      setShowScrollToTop(true);
    } else if (offsetY <= 0 && showScrollToTop) {
      setShowScrollToTop(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProperties(true);
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={{ flex: 1 }}>
       
        <View style={{ flex: 1, }}>
          <FlatList
            ref={flatListRef}
            data={properties}
            keyExtractor={(item, index) =>
              item?.unique_property_id
                ? item.unique_property_id
                : `fallback-${index}`
            }
            renderItem={renderPropertyCard}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            nestedScrollEnabled={true}
            initialNumToRender={4}
            windowSize={10}
            maxToRenderPerBatch={4}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={true}
            contentContainerStyle={{ paddingHorizontal: 10, }}
            ListEmptyComponent={() =>
              !loading && <NBText textAlign={"center"}>No properties found.</NBText>
            }
            ListFooterComponent={
              <TouchableOpacity
                style={styles.fixedExploreButton}
                onPress={handlePropertiesLists}
              >
              </TouchableOpacity>
            }
          />
        </View>
      </View>
      <Modal
        transparent={true}
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setModalVisible(false);
          }}
        >
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
              <View style={styles.modalContent}>
                <ShareDetailsModal
                  type={type}
                  modalVisible={modalVisible}
                  setModalVisible={setModalVisible}
                  selectedPropertyId={selectedPropertyId}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: 350,
    height: 210,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    marginRight: 15,
    marginVertical: 10,
    overflow: "hidden",
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
   
    
    flexDirection: "row",
  },
  imageContainer: {
    position: "relative",
    width: 172, 
    height: "100%", 
  },
  image: {
    width: 162,
    height: 162,
    borderRadius: 15,
    margin: 10, 
  },
  actionButtons: {
    position: "absolute",
    top: 20,
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
  detailsContainer: {
    flex: 1,
    paddingVertical: 10,
    paddingLeft: 10, 
    paddingRight: 15,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
    fontFamily: 'PoppinsSemiBold',
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  locationText: {
    fontSize: 12,
    color: "#616161",
    marginLeft: 4,
    marginTop:1,
    fontFamily:'Poppins',
  },
  featuresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 2,
  },
  secondRowFeatures: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  featureText: {
    fontSize: 12,
    color: "#000",
    marginLeft: 4,
    marginTop:2,
    fontWeight: "500",
    fontFamily: 'PoppinsSemiBold',
  },
  directionIcon: {
    width: 14,
    height: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  directionIconText: {
    fontSize: 14,
    color: "#666",
  },
  bottomContainer: {
    alignItems: "flex-end",
    marginTop: 4,
  },
  enquireButton: {
    backgroundColor: "#1D3A76",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
   
    
  },
  enquireButtonText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
});
