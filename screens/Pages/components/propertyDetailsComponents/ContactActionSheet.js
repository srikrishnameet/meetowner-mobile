// ContactActionSheet.js
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { StyleSheet } from "react-native";

const ContactActionSheet = ({ isOpen, onClose, onSubmit, userDetails, title, type }) => {
  const [formData, setFormData] = useState({
    name: userDetails?.name || "",
    phone: userDetails?.phone || "",
    email: userDetails?.email || "",
  });

  const handleSubmit = async () => {
    try {
      let apiUrl;
      // Determine the API endpoint based on the type
      if (type === "enquireNow") {
        apiUrl = "https://api.meetowner.in/enquire-now"; // Replace with actual Enquire Now API
      } else if (type === "contactNow") {
        apiUrl = "https://api.meetowner.in/contact-now"; // Replace with actual Contact Now API
      } else {
        throw new Error("Invalid type provided");
      }

      // Make the API call
      const response = await axios.post(apiUrl, {
        name: formData.name,
        mobile: formData.mobile,
        email: formData.email,
        user_id: userDetails?.user_id || "",
      });

      console.log(`API Response for ${type}:`, response.data);

   
      if (onSubmit) {
        onSubmit(formData);
      }
    } catch (error) {
      console.error(`Error submitting form for ${type}:`, error);
    } finally {
      onClose();
    }
  };


  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isOpen}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.bottomSheet}>
          <View style={styles.bottomSheetHeader}>
            <Text style={styles.bottomSheetTitle}>{title} </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.formContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) =>
                setFormData({ ...formData, name: text })
              }
              placeholder="Enter your name"
            />
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) =>
                setFormData({ ...formData, phone: text })
              }
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) =>
                setFormData({ ...formData, email: text })
              }
              placeholder="Enter your email"
              keyboardType="email-address"
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    width: "100%",
  },
  bottomSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    width: "100%",
    height: "55%",
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontFamily: "PoppinsSemiBold",
    color: "#333",
  },
  closeButton: {
    fontSize: 18,
    color: "#333",
  },
  formContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
    fontFamily: "PoppinsMedium",
  },
  input: {
    borderWidth: 2,
    borderColor: "#EDF2FF",
    borderRadius: 30,
    paddingHorizontal:10,
    paddingVertical:16,
    marginBottom: 15,
    fontSize: 14,
    fontFamily: "PoppinsRegular",
    shadowColor: "#4979FB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    
  },
  submitButton: {
    backgroundColor: "#1D3A76",
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "PoppinsMedium",
  },
});

export default ContactActionSheet;