import ChatScreen from "@/components/chat-screen";
import { useLocalSearchParams } from "expo-router";

export default function RequesterChat() {
  const { errandId, helperName, otherPersonPhone } = useLocalSearchParams<{
    errandId: string;
    helperName: string;
    otherPersonPhone: string;
  }>();

  return (
    <ChatScreen
      errandId={errandId}
      otherPersonName={helperName ?? "Chat"}
      otherPersonPhone={otherPersonPhone}
    />
  );
}
