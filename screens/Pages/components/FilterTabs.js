import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";

const tabs = [
  { id: "buy", label: "Buy" },
  { id: "rent", label: "Rent" },
  { id: "plot", label: "Plot" },
  { id: "commercial", label: "Commercial" },
];

export default function FilterTabs() {
  const [activeTab, setActiveTab] = useState("buy");

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            activeTab === tab.id && styles.activeTab,
          ]}
          onPress={() => setActiveTab(tab.id)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab.id && styles.activeTabText,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 15,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    marginRight: 10,
    backgroundColor: "#ffffff",
    borderColor:"#DBDADA",
    borderWidth:1,
  },
  activeTab: {
    backgroundColor: "#1D3A76",
  },
  tabText: {
    fontSize: 12,
    color: "#000",

    fontFamily: 'PoppinsSemiBold',
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "500",
   
  },
});