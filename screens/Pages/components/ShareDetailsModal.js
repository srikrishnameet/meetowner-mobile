import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Platform,
} from "react-native";
import config from "../../../config";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Box, HStack, Text, Toast } from "native-base";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Modal } from "react-native";
const ShareDetailsModal = ({
  type,
  modalVisible,
  setModalVisible,
  selectedPropertyId,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [owner, setOwner] = useState("");
  const getDynamicMaxDate = () => {
    const currentYear = new Date().getFullYear();
    return new Date(currentYear, 11, 31);
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
  useEffect(() => {
    const getData = async () => {
      const data = await AsyncStorage.getItem("profileData");
      if (data) {
        const parsedUserDetails = JSON.parse(data);
        setUserInfo(parsedUserDetails.data);
        setName(parsedUserDetails?.data?.name || "");
        setEmail(parsedUserDetails?.data?.email || "");
        setMobile(parsedUserDetails?.data?.mobile || "");
      }
    };
    getData();
    getOwnerDetails(selectedPropertyId);
  }, [selectedPropertyId, modalVisible, type]);
  const handleAPI = async () => {
    const payload = {
      channelId: "67a9e14542596631a8cfc87b",
      channelType: "whatsapp",
      recipient: { name: owner?.name, phone: `91${owner?.mobile}` },
      whatsapp: {
        type: "template",
        template: {
          templateName: "leads_information_for_partners_clone",
          bodyValues: {
            name: userInfo?.name,
            phone: userInfo?.mobile,
            variable_3:
              selectedPropertyId?.property_subtype ||
              selectedPropertyId?.sub_type ||
              "Property",
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
      const response1 = await axios.post(url, payload, { headers });
      Toast.show({
        duration: 1000,
        placement: "top-right",
        render: () => {
          return (
            <Box bg="green.300" px="2" py="1" mr={5} rounded="sm" mb={5}>
              Details submitted successfully.
            </Box>
          );
        },
      });
      setModalVisible(false);
    } catch (error) {
      setModalVisible(false);
    } finally {
      setModalVisible(false);
      setIsLoading(false);
    }
  };
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    setDate(currentDate);
  };
  const onTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || time;
    setShowTimePicker(false);
    setTime(currentTime);
  };
  const showDatepicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: date,
        mode: "date",
        onChange: onDateChange,
        minimumDate: new Date(),
        maximumDate: getDynamicMaxDate(),
      });
    } else {
      setShowDatePicker(true);
      setShowTimePicker(false);
    }
  };
  const showTimepicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: time,
        mode: "time",
        is24Hour: true,
        onChange: onTimeChange,
      });
    } else {
      setShowTimePicker(true);
      setShowDatePicker(false);
    }
  };
  const handleSchedule = () => {
    setIsLoading(true);
    if (name === "" || email === "" || mobile === "") {
      setIsLoading(false);
      Alert.alert("Error", "All fields are required");
      return false;
    }
    const formattedDate = date ? date.toLocaleDateString("en-CA") : "";
    const formattedTime = time
      ? time.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : "";
    const url = `${config.mainapi_url}/favourites_exe.php?user_id=${
      userInfo?.id
    }&unique_property_id=${
      selectedPropertyId?.unique_property_id
    }&action=3&intrst=1&name=${userInfo?.name || name}&mobile=${
      userInfo?.mobile
    }&email=${
      userInfo?.email || email
    }&shedule_date=${formattedDate}&shedule_time=${formattedTime}`;
    fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    })
      .then(async (response) => {
        if (response.ok) {
          const text = await response.text();
          return text ? JSON.parse(text) : {};
        }
      })
      .then((respdata) => {
        setIsLoading(false);
        setName("");
        setEmail("");
        setMobile("");
        setDate(null);
        setTime(null);
      })
      .catch((error) => {
        setModalVisible(false);
        setIsLoading(false);
      });
  };
  const handleSubmit = () => {
    handleAPI();
    handleSchedule();
  };
  return (
    <View style={styles.container}>
      <HStack justifyContent={"space-between"} mb={2} alignItems={"center"}>
        <Text fontSize={16} fontWeight={"bold"}>
          {type === "scheduleVisit" ? "Schedule a Visit" : "Enquire Now"}
        </Text>
        <TouchableOpacity
          style={styles.closeIcon}
          onPress={() => setModalVisible(false)}
        >
          <Ionicons name="close-circle" size={30} color="#333" />
        </TouchableOpacity>
      </HStack>
      <TextInput
        placeholder="Enter Name"
        placeholderTextColor="#999"
        value={name}
        onChangeText={(text) => setName(text)}
        style={styles.input}
      />
      <TextInput
        placeholder="Enter Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={(text) => setEmail(text)}
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        placeholder="Enter Mobile"
        placeholderTextColor="#999"
        value={mobile}
        onChangeText={(text) => setMobile(text)}
        keyboardType="phone-pad"
        style={styles.input}
      />
      <Pressable onPress={showDatepicker} style={styles.pressable}>
        <View style={styles.iconContainer}>
          <MaterialIcons
            name="date-range"
            size={24}
            color="white"
            style={styles.icon}
          />
        </View>
        {date ? (
          <Text style={styles.dateText}>{date?.toDateString()}</Text>
        ) : (
          <Text style={styles.placeholderText}>Select Date</Text>
        )}
      </Pressable>
      <Pressable onPress={showTimepicker} style={styles.pressable}>
        <View style={styles.iconContainer}>
          <MaterialIcons
            name="access-time"
            size={24}
            color="white"
            style={styles.icon}
          />
        </View>
        {time ? (
          <Text style={styles.dateText}>
            {time?.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        ) : (
          <Text style={styles.placeholderText}>Select Time</Text>
        )}
      </Pressable>
      {showDatePicker && Platform.OS === "ios" && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                onChange={onDateChange}
                minimumDate={new Date()}
                maximumDate={getDynamicMaxDate()}
              />
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                style={styles.modalButton}
              >
                <Text style={styles.buttonText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                style={styles.modalButton}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      {showTimePicker && Platform.OS === "ios" && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showTimePicker}
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <DateTimePicker
                value={time}
                mode="time"
                display="spinner"
                onChange={onTimeChange}
              />
              <TouchableOpacity
                onPress={() => setShowTimePicker(false)}
                style={styles.modalButton}
              >
                <Text style={styles.buttonText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowTimePicker(false)}
                style={styles.modalButton}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "Sending..." : "Submit"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    position: "relative",
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 15,
    paddingLeft: 10,
    borderRadius: 8,
  },
  closeIcon: {
    position: "absolute",
    right: -5,
    top: -10,
    zIndex: 1,
  },
  button: {
    backgroundColor: "#1D3A76",
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  pressable: {
    height: 48,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 8,
    marginBottom: 10,
  },
  iconContainer: {
    height: "100%",
    width: "15%",
    justifyContent: "center",
    backgroundColor: "#1D3A76",
    alignItems: "center",
  },
  icon: {
    marginHorizontal: "auto",
  },
  dateText: {
    fontSize: 16,
    color: "#000",
    flex: 1,
    marginLeft: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: "#9ca3af",
    flex: 1,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(242, 240, 240, 0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#1D3A76",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalButton: {
    marginTop: 10,
    width: "100%",
    borderColor: "#fff",
    borderWidth: 0.5,
    padding: 10,
    borderRadius: 30,
  },
});
export default ShareDetailsModal;
