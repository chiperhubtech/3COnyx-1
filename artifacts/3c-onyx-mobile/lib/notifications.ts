/**
 * 3C Onyx — Push Notification Registration
 * Registers device for Expo push notifications and saves token to the API.
 */
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { apiFetch } from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound:  true,
    shouldSetBadge:   true,
    shouldShowList:   true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID ?? "3c-onyx",
    });
    const pushToken = tokenData.data;

    await apiFetch("/users/push-token", {
      method: "PATCH",
      body:   JSON.stringify({ pushToken }),
    }).catch(() => {});

    return pushToken;
  } catch {
    return null;
  }
}

export async function sendLocalNotification(title: string, body: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: "default" },
    trigger: null,
  });
}
