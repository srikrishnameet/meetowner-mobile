import React from "react";
import { View, TextInput, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Box } from "native-base";
import FilterIcon from '../../../../assets/propertyicons/filter.png';

const SearchBarProperty = ({
  searchQuery,
  setSearchQuery,
  handleLocationSearch,
  fetchProperties,
  filters,

}) => {
  return (
    <View style={styles.searchContainer}>
      <View style={styles.inputContainer}>
        <Ionicons
          name="search"
          size={20}
          color="gray"
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Search City, Locality, Property, Projects"
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={(text) => {
            handleLocationSearch(text);
            setSearchQuery(text);
          }}
          style={styles.textInput}
        />
        {searchQuery.trim() !== "" && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery("");
              handleLocationSearch("");
              fetchProperties(false, filters, "Hyderabad");
            }}
            style={styles.cancelIcon}
          >
            <Ionicons name="close-circle" size={20} color="gray" />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity
        style={styles.avatarButton}
        onPress={() => {
          if (searchQuery.trim()) {
            const searchedLocation = searchQuery.trim();
            fetchProperties(true, filters, searchedLocation);
          } else {
            fetchProperties(false, filters, "Hyderabad");
          }
        }}
      >
        <Box
          width={36}
          height={36}
          borderRadius={18}
          backgroundColor="#1D3A76" // Blue background
          alignItems="center"
          justifyContent="center"
        >
          <Image
            source={FilterIcon}
            style={{ width: 20, height: 20, tintColor: "#fff" }} // White icon
            resizeMode="contain"
          />
        </Box>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginHorizontal: 10,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  searchIcon: {
    marginLeft: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingLeft: 40, // Space for search icon
    paddingRight: 40, // Space for cancel icon
    paddingVertical: 8,
    fontFamily: "Poppins",
  },
  cancelIcon: {
    position: "absolute",
    right: 10,
  },
  avatarButton: {
    marginLeft: 10,
  },
});

export default SearchBarProperty;