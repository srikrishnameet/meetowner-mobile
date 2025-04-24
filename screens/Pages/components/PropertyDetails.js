import React, { useCallback, useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  Share,
  View,
  Text,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { Toast, Box, FlatList } from 'native-base';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import ShareDetailsModal from './ShareDetailsModal';
import PropertyHeader from './propertyHeader';
import { Pressable } from 'react-native';

const facilityIconMap = {
  'Lift': 'caret-back-circle-outline',
  'CCTV': 'videocam-outline',
  'Gym': 'fitness-outline',
  'Garden': 'leaf-outline',
  'Club House': 'business-outline',
  'Sports': 'tennisball-outline',
  'Swimming Pool': 'water-outline',
  'Intercom': 'call-outline',
  'Power Backup': 'battery-charging-outline',
  'Gated Community': 'lock-closed-outline',
  'Regular Water': 'water-outline',
  'Community Hall': 'people-outline',
  'Pet Allowed': 'paw-outline',
  'Entry / Exit': 'enter-outline',
  'Outdoor Fitness Station': 'barbell-outline',
  'Half Basket Ball Court': 'basketball-outline',
  'Gazebo': 'home-outline',
  'Badminton Court': 'tennisball-outline',
  'Children Play Area': 'happy-outline',
  'Ample Greenery': 'leaf-outline',
  'Water Harvesting Pit': 'water-outline',
  'Water Softener': 'filter-outline',
  'Solar Fencing': 'sunny-outline',
  'Security Cabin': 'shield-outline',
  'Lawn': 'leaf-outline',
  'Transformer Yard': 'flash-outline',
  'Amphitheatre': 'musical-notes-outline',
  'Lawn with Stepping Stones': 'leaf-outline',
  'None': 'close-outline',
};

export default function PropertyDetails({ navigation }) {
  const property = useSelector((state) => state.property.propertyDetails);

  const formatToIndianCurrency = (value) => {
    if (value >= 10000000) return (value / 10000000).toFixed(2) + ' Cr';
    if (value >= 100000) return (value / 100000).toFixed(2) + ' L';
    if (value >= 1000) return (value / 1000).toFixed(2) + ' K';
    return value;
  };

  const [userInfo, setUserInfo] = useState('');
  const [location, setLocation] = useState(null);
 
  const [region, setRegion] = useState(null);
  const [facilites, setFacilities] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [type, setType] = useState('');
  const [isInterested, setIsInterested] = useState(false);
  const [submittedType, setSubmittedType] = useState(null);
  const [owner, setOwner] = useState('');
  const [floorPlan,setFloorPlan] = useState('');
  const [isFloorPlanModalVisible, setIsFloorPlanModalVisible] = useState(false); 
  const [photos,setPhotos] = useState([]);
  const [isPhotosLoading, setIsPhotosLoading] = useState(false);

  const getCacheKey = () => `photos_${property?.unique_property_id}`;

  useEffect(() => {
    const getData = async () => {
      const data = await AsyncStorage.getItem('userdetails');
      const parsedUserDetails = JSON.parse(data);
      setUserInfo(parsedUserDetails);
    };
    getData();
    getCoordinatesFromAddress(property.google_address);
    fetchFacilities();
    fetchFloorPlans();
    fetchProjectPhotos();
  }, [property?.google_address, property?.unique_property_id, fetchProjectPhotos]);

  const fetchFloorPlans = async () => {
    try {
      const response = await fetch(
        `https://api.meetowner.in/listings/v1/getAllFloorPlans/${property?.unique_property_id}`
      );
      const data = await response.json();
    
      if (data && data.length > 0 && data[0].image) {
        const imageUrl = `https://api.meetowner.in/uploads/${data[0].image}`;
        setFloorPlan(imageUrl);
      } else {
        setFloorPlan(''); 
      }
    } catch (error) {
      console.error('Error fetching floor plans:', error);
      setFloorPlan(''); 
    }
  };

  const fetchProjectPhotos = useCallback(async () => {
    setIsPhotosLoading(true);
    try {
      // Check cache first
      const cachedPhotos = await AsyncStorage.getItem(getCacheKey());
      if (cachedPhotos) {
        const parsedPhotos = JSON.parse(cachedPhotos);
    
        setPhotos(parsedPhotos);
        setIsPhotosLoading(false);
        return; // Exit if cache is found
      }

      // Fetch from API
      const response = await fetch(
        `https://api.meetowner.in/property/getpropertyphotos?unique_property_id=${property?.unique_property_id}`
      );
      const data = await response.json();
   
      if (data && data.status === 'success' && data.images && data.images.length > 0) {
        const imageUrls = data.images.map((image) => image.url);
       
        setPhotos(imageUrls);
        // Cache the photos
        await AsyncStorage.setItem(getCacheKey(), JSON.stringify(imageUrls));
       
      } else {
        console.log('No project photos available');
        setPhotos([]);
      }
    } catch (error) {
      console.error('Error fetching project photos:', error);
      setPhotos([]);
    } finally {
      setIsPhotosLoading(false);
    }
  }, [property?.unique_property_id]);
  const fetchFacilities = async () => {
    try {
      const response = await fetch(
        `https://api.meetowner.in/listings/getsingleproperty?unique_property_id=${property?.unique_property_id}`
      );
      const data = await response.json();
      setFacilities(data?.property_details?.facilities);
    } catch (error) {}
  };

  const getCoordinatesFromAddress = async (address) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json`,
        {
          params: {
            address: address,
            key: 'AIzaSyBmei9lRUUfJI-kLIPNBoc2SxEkwhKHyvU',
          },
        }
      );
      if (response?.data?.status === 'OK' && response.data.results.length > 0) {
        const { lat, lng } = response.data.results[0].geometry.location;
        const initialRegion = {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setLocation(initialRegion);
        setRegion(initialRegion);
      } else {
        setLocation({
          latitude: 17.385044,
          longitude: 78.486671,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    } catch (error) {
      setLocation({
        latitude: 17.385044,
        longitude: 78.486671,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };

  const handleViewInMaps = () => {
    if (location?.latitude && location?.longitude) {
      const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
      Linking.openURL(url);
    } else {
      alert('Location not available');
    }
  };

  const handleMetrics = async (type) => {
    await axios.post('https://api.meetowner.in/metrics/saveAnalytics', {
      user_id: userInfo?.user_id || '',
      user_name: userInfo?.name || '',
      mobile_number: userInfo?.mobile || '',
      location: property?.google_address || 'N/A',
      searched_query: property?.property_name || 'N/A',
      unique_property_id: property?.unique_property_id || 'N/A',
      userContacts: '',
      intrest_type: type || '',
      created_at: '',
    });
  };

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
      channelId: '67a9e14542596631a8cfc87b',
      channelType: 'whatsapp',
      recipient: { name: owner?.name, phone: `91${owner?.mobile}` },
      whatsapp: {
        type: 'template',
        template: {
          templateName: 'leads_information_for_partners_clone',
          bodyValues: {
            name: userInfo?.name,
            phone: userInfo?.mobile,
            variable_3:
              selectedPropertyId?.property_subtype ||
              selectedPropertyId?.sub_type ||
              'Property',
            variable_4: selectedPropertyId?.property_name,
            variable_5: selectedPropertyId?.google_address.split(',')[0].trim(),
          },
        },
      },
    };
    const headers = {
      apiKey: '67e3a37bfa6fbc8b1aa2edcf',
      apiSecret: 'a9fe1160c20f491eb00389683b29ec6b',
      'Content-Type': 'application/json',
    };
    try {
      const url = 'https://server.gallabox.com/devapi/messages/whatsapp';
      const response1 = await axios.post(url, payload, { headers });
      Toast.show({
        duration: 1000,
        placement: 'top-right',
        render: () => {
          return (
            <Box bg="green.300" px="2" py="1" mr={5} rounded="sm" mb={5}>
              Details submitted successfully.
            </Box>
          );
        },
      });
    } catch (error) {}
  };

  const handleScheduleVisit = () => {
    setModalVisible(true);
    setSelectedPropertyId(property);
  };

  const handleIntrests = async (type) => {
    setSelectedPropertyId(property);
    await handleAPI();
    setType(type);
    setSubmittedType(type);
    setIsInterested(!isInterested);
    await handleMetrics(type);
  };

  const shareProperty = async () => {
    try {
      await Share.share({
        message: `Check out this property: ${property.property_name} at ${property.google_address}. ${property.bedrooms} BHK ${property.sub_type} for ₹${formatToIndianCurrency(property.property_cost)}. https://api.meetowner.in/property?unique_property_id=${property.unique_property_id}`,
        url: `https://api.meetowner.in/property?unique_property_id=${property.unique_property_id}`,
        title: `Property: ${property.property_name}`,
      });
    } catch (error) {
      console.error('Error sharing property:', error);
    }
  };

  const handleShare = useCallback(() => {
    shareProperty();
  }, []);

  // Memoize photos data
  const memoizedPhotos = useMemo(() => photos, [photos]);

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <FlatList
      data={[1, 2, 3, 4]} // Dummy items for skeleton
      horizontal
      keyExtractor={(item) => `skeleton-${item}`}
      renderItem={() => (
        <View style={styles.skeletonPhoto} />
      )}
      showsHorizontalScrollIndicator={false}
    />
  );

  // Set navigation options to include PropertyHeader
  React.useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <PropertyHeader
          navigation={navigation}
          title="Property Details"
          isInterested={isInterested}
          handleIntrests={handleIntrests}
          handleShare={handleShare}
        />
      ),
    });
  }, [navigation, isInterested, handleIntrests, handleShare]);

  return (
    <View style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.section}>
     
     
          {isPhotosLoading ? (
            <SkeletonLoader />
          ) : photos.length > 0 ? (
            <FlatList
              data={memoizedPhotos}
              horizontal
              keyExtractor={(item, index) => `${item}-${index}`}
              renderItem={({ item }) => (
                <Pressable onPress={() => openPhotoModal(item)}>
                  <Image
                    source={{ uri: item }}
                    style={styles.projectPhoto}
                    resizeMode="cover"
                    onError={(error) => console.log('Project photo error:', error.nativeEvent)}
                  />
                </Pressable>
              )}
              showsHorizontalScrollIndicator={false}
            />
          ) : (
            <Text style={styles.noImageText}>No project photos available</Text>
          )}

        
          <Text style={styles.overview}>Overview</Text>
          <View style={styles.containerPosession}>
            <Text style={styles.possesionText}>
              {property?.occupancy === 'Ready to move'
                ? 'Ready to move'
                : property?.under_construction
                ? `Possession by ${new Date(property.under_construction).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}`
                : 'N/A'}
            </Text>
            <Text style={styles.propertyname}>{property.property_name} /{property.location_id}</Text>
            
           
          </View>
          <Text style={styles.overview}>Pricing</Text>
          <View style={styles.containerPosession}>
            <Text style={styles.propertyPrice}> ₹ {formatToIndianCurrency(property.property_cost)}</Text>
            <Text style={styles.propertBHK}>
              {property?.bedrooms + ' BHK  '}
              {property?.sub_type} for Sale
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.card}>
            <View style={styles.overviewGrid}>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Project Area</Text>
                <Text style={styles.overviewValue}>{property.total_project_area} Acres</Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Built-up Area</Text>
                <Text style={styles.overviewValue}>{property.builtup_area} Sq.ft</Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Occupancy Status</Text>
                <Text style={styles.overviewValue}>{property.occupancy}</Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Property Type</Text>
                <Text style={styles.overviewValue}>{property.property_in}</Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Bedrooms</Text>
                <Text style={styles.overviewValue}>{property.bedrooms || 0}</Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Bathrooms</Text>
                <Text style={styles.overviewValue}>{property?.bathroom || 0}</Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Car Parking</Text>
                <Text style={styles.overviewValue}>{property.car_parking || 0}</Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Facing</Text>
                <Text style={styles.overviewValue}>{property.facing || 0}</Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Furnished</Text>
                <Text style={styles.overviewValue}>{property.furnished_status || 'No'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Floor Plan</Text>
          {floorPlan ? (
            <Pressable onPress={() => setIsFloorPlanModalVisible(true)}>
              <Image
                source={{ uri: floorPlan }}
                style={styles.floorPlanImage}
                resizeMode="cover"
                onError={(error) => console.log('Image loading error:', error.nativeEvent)}
              />
            </Pressable>
          ) : (
            <Text style={styles.noImageText}>No floor plan available</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Facilities</Text>
          <View style={styles.card}>
            <View style={styles.facilitiesGrid}>
              {typeof facilites === 'string' && facilites.trim() !== '' ? (
                facilites.split(', ').map((facility, index) => (
                  <View key={index} style={styles.facilityItem}>
                    <Ionicons
                      name={facilityIconMap[facility.trim()] || 'help-circle-outline'}
                      size={20}
                      color="#000"
                      style={styles.facilityIcon}
                    />
                    <Text style={styles.facilityText}>{facility.trim()}</Text>
                  </View>
                ))
              ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={styles.facilityText}>No details available</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View
          style={{
            borderRadius: 30,
            shadowColor: '#fff',
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 0.2,
            shadowRadius: 5,
            elevation: 5,
            marginBottom: 10,
          }}
        >
          {region ? (
            <MapView
              style={styles.map}
              region={region}
              onRegionChangeComplete={(newRegion) => setRegion(newRegion)}
              showsScale={true}
              loadingEnabled={true}
            >
              <Marker
                coordinate={{
                  latitude: location?.latitude,
                  longitude: location?.longitude,
                }}
                title="Location"
                description="This is your selected location"
              />
            </MapView>
          ) : (
            <Text fontSize={16} fontWeight={'bold'} textAlign={'center'}>
              Loading map...
            </Text>
          )}
        </View>

        {/* <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            paddingHorizontal: 10,
          }}
        >
          <TouchableOpacity
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 0.5,
              backgroundColor: '#1D3A76',
              paddingHorizontal: 30,
              paddingVertical: 10,
              borderRadius: 30,
            }}
            onPress={handleViewInMaps}
          >
            <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'PoppinsSemiBold' }}>
              View in Maps
            </Text>
          </TouchableOpacity>
        </View> */}
      </ScrollView>

      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => handleScheduleVisit('schedule visit')}
        >
          <Text style={styles.chatButtonText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => handleScheduleVisit('contact seller')}
        >
          <Text style={styles.ctaButtonText}>Contact Seller</Text>
        </TouchableOpacity>
      </View>

      <Modal
        transparent={true}
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
              <View style={styles.modalContent}>
                <ShareDetailsModal
                  type={type}
                  modalVisible={modalVisible}
                  setModalVisible={setModalVisible}
                  selectedPropertyId={property}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <Modal
        visible={isFloorPlanModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsFloorPlanModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Close Button */}
          <Pressable
            style={styles.closeButton}
            onPress={() => setIsFloorPlanModalVisible(false)}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </Pressable>

          {/* Full-Screen Image */}
          <Image
            source={{ uri: floorPlan }}
            style={styles.fullScreenImage}
            resizeMode="contain"
            onError={(error) => console.log('Full-screen image loading error:', error.nativeEvent)}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  projectPhoto: {
    width: 350,
    height: 200,
    borderRadius: 10,
    marginRight: 10,
    marginVertical: 10,
    backgroundColor: '#e0e0e0', 
  },
  container: {
    padding: 13,
    backgroundColor: '#f5f5f5',
    paddingBottom: 100,
  },
  map: {
    width: '100%',
    height: 250,
    borderRadius: 30,
    marginTop: 5,
  },
  propertyImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 16 / 9,
    borderRadius: 10,
    marginTop: 30,
    marginBottom: 16,
    overflow: 'hidden',
  },
  containerPosession: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    margin: 5,
    padding: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  possesionText: {
    fontSize: 14,
    fontFamily: 'PoppinsSemiBold',
    color: '#7C7C7C',
    margin: 5,
  },
  overview: {
    fontSize: 14,
    fontFamily: 'PoppinsSemiBold',
    color: '#000',
  },
  propertyname: {
    fontSize: 14,
    fontFamily: 'PoppinsSemiBold',
    color: '#000',
    marginTop: 5,
  },
  propertyPrice: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: 'PoppinsSemiBold',
    color: '#000',
  },
  propertBHK: {
    marginTop: 5,
    fontSize: 14,
    fontFamily: 'Poppins',
    color: '#7C7C7C',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'PoppinsSemiBold',
    color: '#000',
  },
  card: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    margin: 5,
    padding: 20,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  overviewGrid: {
    flexDirection: 'column',
  },
  overviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  overviewLabel: {
    fontSize: 14,
    flex: 1,
    fontFamily: 'PoppinsSemiBold',
    color: '#000',
  },
  overviewValue: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
    color: '#000',
    textAlign: 'right',
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  facilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 12,
  },
  facilityIcon: {
    marginRight: 8,
  },
  facilityText: {
    fontSize: 12,
    fontFamily: 'PoppinsSemiBold',
    color: '#000',
    flex: 1,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  ctaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#ffffff',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 0,
    elevation: 1,
  },
  ctaButton: {
    backgroundColor: '#1D3A76',
    padding: 12,
    borderRadius: 30,
    width: '48%',
    alignItems: 'center',
  },
  chatButton: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 30,
    width: '48%',
    alignItems: 'center',
    borderColor: '#1D3A76',
    borderWidth: 0.5,
  },
  chatButtonText: {
    color: '#000',
    fontSize: 14,
    
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 14,
   
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 10,
  },
  floorPlanImage: {
    width: '100%',

    aspectRatio: 16 / 9,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 16,
    overflow: 'hidden',
  },
  noImageText: {
    fontSize: 14,
    fontFamily: 'Poppins',
    color: '#7C7C7C',
    textAlign: 'center',
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
});