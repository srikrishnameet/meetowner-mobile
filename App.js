import React, { useEffect, useRef, useState } from "react";
import { NativeBaseProvider } from "native-base";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MainNav from "./screens/Navigations/MainNav";
import { Provider, useDispatch } from "react-redux";
import store, { persistor } from "./store/store";
import { PersistGate } from "redux-persist/integration/react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
const API_URL = "https://api.meetowner.in/token/save-token";
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
async function registerForPushNotificationsAsync(user_id, user_name) {
  let token;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default Channel",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }
  if (!Device.isDevice) {
    return null;
  }
  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      return null;
    }
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      throw new Error("Project ID not found");
    }
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;
    await savePushTokenToBackend(user_id, user_name, token);
  } catch (error) {
    return null;
  }
  return token;
}
async function savePushTokenToBackend(user_id, user_name, pushToken) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user_id,
        user_name: user_name,
        pushToken: pushToken,
      }),
    });
    const result = await response.json();
    if (result.success) {
    }
  } catch (error) {}
}
export default function App() {
  const [expoPushToken, setExpoPushToken] = useState("");

  const [notification, setNotification] = useState(undefined);
  const notificationListener = useRef();
  const responseListener = useRef();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NativeBaseProvider>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <AppContent
              setExpoPushToken={setExpoPushToken}
              expoPushToken={expoPushToken}
              setNotification={setNotification}
              notificationListener={notificationListener}
              responseListener={responseListener}
            />
          </PersistGate>
        </Provider>
      </NativeBaseProvider>
    </GestureHandlerRootView>
  );
}
function AppContent({
  setExpoPushToken,
  expoPushToken,
  setNotification,
  notificationListener,
  responseListener,
}) {
  const dispatch = useDispatch();
  const [userData, setUserData] = useState([]);
  useEffect(() => {
    const getData = async () => {
      const userDataString = await AsyncStorage.getItem("userdetails");
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setUserData(userData);
        registerForPushNotificationsAsync(userData?.user_id, userData?.name);
      }
    };
    getData();

    registerForPushNotificationsAsync(userData?.user_id, userData?.name).then(
      (token) => {
        if (token) {
          setExpoPushToken(token);
        }
      }
    );
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const { data } = response.notification.request.content;
        if (data?.screen) {
        }
      });
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [dispatch]);
  return <MainNav />;
}
