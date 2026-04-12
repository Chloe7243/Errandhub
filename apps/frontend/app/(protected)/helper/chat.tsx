import ChatScreen from "@/components/chat-screen";
import { useLocalSearchParams } from "expo-router";

export default function HelperChat() {
  const { errandId, requesterName } = useLocalSearchParams<{
    errandId: string;
    requesterName: string;
  }>();

  console.log({ requesterName });

  return (
    <ChatScreen errandId={errandId} otherPersonName={requesterName ?? "Chat"} />
  );
}
