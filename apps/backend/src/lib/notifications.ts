import { prisma } from "./prisma";

// Small wrapper around Expo's push service. We don't keep our own push
// infrastructure — tokens are issued on-device by Expo and submitted to this
// public endpoint which relays to APNs/FCM.

type PushMessage = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

const sendPush = async (token: string, message: PushMessage) => {
  await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      to: token,
      sound: "default",
      title: message.title,
      body: message.body,
      data: message.data ?? {},
    }),
  });
};

/**
 * Send a push notification to a user by id.
 *
 * Looks up the stored Expo push token and fires sendPush. Silently no-ops
 * if the user has no token (notifications not yet opted in). Any error is
 * logged but swallowed — a push failing must never abort the calling
 * business flow (errand creation, status change, chat, etc.).
 */
export const notifyUser = async (
  userId: string,
  message: PushMessage,
): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { expoPushToken: true },
    });
    if (!user?.expoPushToken) return;
    await sendPush(user.expoPushToken, message);
  } catch (err) {
    console.error("Push notification failed:", err);
  }
};
