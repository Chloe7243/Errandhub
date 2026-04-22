import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

// Show notifications when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions and return the device's Expo push token.
 *
 * The returned token is stored server-side against the user so future
 * notifyUser calls can reach this device. Returns null (never throws) on
 * any failure path — unsupported simulator, permission denied, missing
 * projectId, network error — so callers can degrade gracefully. Also sets
 * up the default Android notification channel because iOS and Android
 * differ on foreground behaviour configuration.
 */
export const registerForPushNotifications = async (): Promise<
  string | null
> => {
  // Emulators/simulators can't receive real push deliveries.
  if (!Device.isDevice) {
    console.warn("Push notifications require a physical device");
    return null;
  }

  // Android requires an explicit channel to control heads-up/vibration
  // behaviour; iOS uses categories instead.
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  // Only prompt if permission hasn't already been resolved — re-prompting
  // after a previous "deny" is disallowed on iOS anyway.
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Push notification permission denied");
    return null;
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  if (!projectId) {
    console.error("EAS projectId not found in app config");
    return null;
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (e) {
    console.error("Failed to get push token:", e);
    return null;
  }
};
