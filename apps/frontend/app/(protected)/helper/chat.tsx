import ChatScreen from "@/components/chat-screen";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useGetErrandByIdQuery } from "@/store/api/errand";
import { useLocalSearchParams } from "expo-router";

export default function HelperChat() {
  const { errandId, requesterName, otherPersonPhone } = useLocalSearchParams<{
    errandId: string;
    requesterName: string;
    otherPersonPhone: string;
  }>();

  const hasName = requesterName && requesterName !== "Chat";
  const skip = !!hasName;
  const { currentData, isLoading } = useGetErrandByIdQuery(errandId!, { skip });

  const resolvedName = hasName
    ? requesterName
    : currentData?.errand?.requester
      ? `${currentData.errand.requester.firstName} ${currentData.errand.requester.lastName}`
      : "Chat";

  const resolvedPhone =
    otherPersonPhone ?? currentData?.errand?.requester?.phone ?? undefined;

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <ChatScreen
      errandId={errandId}
      otherPersonName={resolvedName}
      otherPersonPhone={resolvedPhone}
    />
  );
}
