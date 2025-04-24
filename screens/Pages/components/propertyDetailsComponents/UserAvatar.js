import React from "react";
import { Image, Box, Text } from "native-base";

const UserAvatar = ({ item, size = 24 }) => {

 const hasValidPhoto = item?.user?.photo && item.user.photo.trim() !== "";

 const firstLetter = item?.user?.name?.charAt(0)?.toUpperCase() || "?";

 return (
        <>
        {hasValidPhoto ? (
            <Image
            source={{
            uri: `https://api.meetowner.in/uploads/${item.user.photo}`,
            }}
            alt={`${item.user.name}'s Profile Picture`}
            width={12}
            height={12}
            borderRadius={30} // Half of width/height for circular shape
            resizeMode="cover" // Ensure image fills the circle
            />
        ) : (
        <Box
            width={12}
            height={12}
            borderRadius={30}
            backgroundColor="#1D3A76" // Customize background color
            alignItems="center"
            justifyContent="center"
        >
        <Text color="#fff" fontSize={size * 0.5} fontWeight="bold">
             {firstLetter}
        </Text>
        </Box>
        )}
        </>
 );
};

export default UserAvatar;