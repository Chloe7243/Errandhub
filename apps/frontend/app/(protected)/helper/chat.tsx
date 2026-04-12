import ChatScreen from "@/components/chat-screen";
import { useLocalSearchParams } from "expo-router";

export default function HelperChat() {
  const { errandId, requesterName, otherPersonPhone } = useLocalSearchParams<{
    errandId: string;
    requesterName: string;
    otherPersonPhone: string;
  }>();

  return (
    <ChatScreen
      errandId={errandId}
      otherPersonName={requesterName ?? "Chat"}
      otherPersonPhone={otherPersonPhone}
    />
  );
}
