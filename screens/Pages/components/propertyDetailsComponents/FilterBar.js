// FilterBar.js
import React, { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View, Image } from "react-native";

import AllIcon from '../../../../assets/propertyicons/all_properties.png';
import VerifiedIcon from '../../../../assets/propertyicons/verified_properties.png';
import newIcon from '../../../../assets/propertyicons/new_properties.png';
import ownerIcon from '../../../../assets/propertyicons/owner_properties.png';
import LuxuryIcon from '../../../../assets/propertyicons/luxury_properties.png';
import ReadyProperties from '../../../../assets/propertyicons/ready_properties.png';

// Define filter options with their corresponding icons
const filterOptions = [
  { name: "All", icon: AllIcon },
  { name: "Meetowner Verified", icon: VerifiedIcon },
  { name: "New Launches", icon: newIcon },
  { name: "Ready to Move", icon: ReadyProperties },
  { name: "Owner Properties", icon: ownerIcon },
  { name: "Luxury Properties", icon: LuxuryIcon },
];

const FilterBar = ({ onFilterChange }) => {
  const [selectedFilter, setSelectedFilter] = useState("All");

  const handleFilterPress = (filter) => {
    setSelectedFilter(filter);
    if (onFilterChange) {
      onFilterChange(filter); // Notify parent component of the selected filter
    }
  };

  const renderFilterItem = ({ item }) => {
    const isSelected = item.name === selectedFilter;
    return (
      <Pressable
        onPress={() => handleFilterPress(item.name)}
        style={[
          styles.filterButton,
          isSelected ? styles.selectedFilterButton : styles.unselectedFilterButton,
        ]}
      >
        <Image
          source={item.icon}
          style={[
            styles.filterIcon,
            isSelected ? styles.selectedFilterIcon : styles.unselectedFilterIcon, // Dynamically adjust icon size
          ]}
          tintColor={isSelected ? "#fff" : "#000"}
          resizeMode="contain"
          onError={(e) => console.log(`Error loading icon for ${item.name}:`, e.nativeEvent.error)}
        />
        <Text
          style={[
            styles.filterText,
            isSelected ? styles.selectedFilterText : styles.unselectedFilterText,
          ]}
        >
          {item.name}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filterOptions}
        renderItem={renderFilterItem}
        keyExtractor={(item) => item.name}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 10,
    paddingHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  flatListContent: {
    paddingHorizontal: 5,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginHorizontal: 5,
  },
  selectedFilterButton: {
    backgroundColor: "#1D3A76",
  },
  unselectedFilterButton: {
    backgroundColor: "#fff",
    borderWidth: 0.3,
    borderColor: "#ccc",
  },
  filterIcon: {
    marginRight: 8,
  },
  unselectedFilterIcon: {
    width: 18,
    height: 18,
  },
  selectedFilterIcon: {
    width: 18 + 5, // Increase by 5
    height: 18 + 5, // Increase by 5
  },
  filterText: {
    fontSize: 14,
    fontFamily: "PoppinsMedium",
    marginTop: 5,
  },
  selectedFilterText: {
    color: "#fff",
  },
  unselectedFilterText: {
    color: "#333",
  },
});

export default FilterBar;