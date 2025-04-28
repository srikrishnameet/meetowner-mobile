import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { setSearchData } from "../../../store/slices/searchSlice";
import { useDispatch, useSelector } from "react-redux";
const tabs = [
  { id: "Buy", label: "Buy" },
  { id: "Rent", label: "Rent" },
  { id: "Plot", label: "Plot" },
  { id: "Commercial", label: "Commercial" },
];

export default function FilterTabs() {
  const data = useSelector((state)=> state.search.tab)
  console.log("redux",data)
  const dispatch =useDispatch()
  const [activeTab, setActiveTab] = useState(data || "Buy");
  console.log(activeTab)
  const handleTabChange=(id)=>{
    console.log("id",id)
    setActiveTab(id)
    dispatch(setSearchData(
      {
        tab:id
      }
    ))
  }

  useEffect(()=>{
    setActiveTab(data || "Buy")
  },[data])

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            activeTab === tab.id && styles.activeTab,
          ]}
          onPress={() => handleTabChange(tab.id)}
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
