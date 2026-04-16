import { prisma } from "./prisma";

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
