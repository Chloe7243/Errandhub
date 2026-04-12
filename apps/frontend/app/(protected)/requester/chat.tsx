import ChatScreen from "@/components/chat-screen";
import { useLocalSearchParams } from "expo-router";

export default function RequesterChat() {
  const { errandId, helperName } = useLocalSearchParams<{
    errandId: string;
    helperName: string;
  }>();

  return (
    <ChatScreen errandId={errandId} otherPersonName={helperName ?? "Chat"} />
  );
}
