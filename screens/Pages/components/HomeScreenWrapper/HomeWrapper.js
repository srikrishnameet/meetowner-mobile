import React, { useCallback } from "react"; // Import useCallback
import { Text, TouchableOpacity, View } from "react-native";
import { HStack, Text as NBText } from "native-base";
import { useNavigation } from "@react-navigation/native"; // Import useNavigation
import LatestPropertiesWrapper from "./LatestPropertiesWrapper";

import { StyleSheet } from "react-native";
import BestDealPropertiesWrapper from "./BestDealPropertiesWrapper";
import HighDealPropertiesWrapper from "./HighDemandProjectsWrapper";
import ExclusivePropertiesWrapper from "./ExclusivePropertiesWrapper";
import HousePickPropertiesWrapper from "./HousePickPropertiesWrapper";

const HomeWrapper = ({ activeTab, selectedCity }) => {
  const navigation = useNavigation(); // Get navigation object

  const handlePropertiesLists = useCallback(() => {
    navigation.navigate("PropertyList", { activeTab });
  }, [navigation, activeTab]); 

  return (
    <View style={styles.container}>
      <HStack py={2} mx={2} justifyContent={"space-between"}>
        <NBText fontSize={20} fontFamily={"PoppinsSemiBold"}>
          Latest Properties
        </NBText>
        <TouchableOpacity onPress={handlePropertiesLists}>
          <NBText fontSize={15} fontFamily={"PoppinsSemiBold"} color={"#000"}>
            View All
          </NBText>
        </TouchableOpacity>
      </HStack>
      <LatestPropertiesWrapper activeTab={activeTab} selectedCity={selectedCity} />
      <HStack py={2} mx={2} justifyContent={"space-between"}>
        <NBText fontSize={20} fontFamily={"PoppinsSemiBold"}>
        Best Deal Properties
        </NBText>
        <TouchableOpacity onPress={handlePropertiesLists}>
          <NBText fontSize={15} fontFamily={"PoppinsSemiBold"} color={"#000"}>
            View All
          </NBText>
        </TouchableOpacity>
      </HStack>
      <BestDealPropertiesWrapper activeTab={activeTab} selectedCity={selectedCity} />
      <HStack py={2} mx={2} justifyContent={"space-between"}>
        <NBText fontSize={20} fontFamily={"PoppinsSemiBold"}>
        Best House Pick's
        </NBText>
        <TouchableOpacity onPress={handlePropertiesLists}>
          <NBText fontSize={15} fontFamily={"PoppinsSemiBold"} color={"#000"}>
            View All
          </NBText>
        </TouchableOpacity>
      </HStack>
      <HousePickPropertiesWrapper activeTab={activeTab} selectedCity={selectedCity} />
      <HStack py={2} mx={2} justifyContent={"space-between"}>
        <NBText fontSize={20} fontFamily={"PoppinsSemiBold"}>
        High Demand Projects
        </NBText>
        <TouchableOpacity onPress={handlePropertiesLists}>
          <NBText fontSize={15} fontFamily={"PoppinsSemiBold"} color={"#000"}>
            View All
          </NBText>
        </TouchableOpacity>
      </HStack>
      <HighDealPropertiesWrapper activeTab={activeTab} selectedCity={selectedCity} />
      <HStack py={2} mx={2} justifyContent={"space-between"}>
        <NBText fontSize={20} fontFamily={"PoppinsSemiBold"}>
        MeetOwner Exclusive
        </NBText>
        
      </HStack>
      <ExclusivePropertiesWrapper activeTab={activeTab} selectedCity={selectedCity} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    backgroundColor: '#f5f5f5',
    marginBottom:100
  },
});

export default HomeWrapper;