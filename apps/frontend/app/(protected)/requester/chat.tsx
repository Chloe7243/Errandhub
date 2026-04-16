import ChatScreen from "@/components/chat-screen";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useGetErrandByIdQuery } from "@/store/api/errand";
import { useLocalSearchParams } from "expo-router";

export default function RequesterChat() {
  const { errandId, helperName, otherPersonPhone } = useLocalSearchParams<{
    errandId: string;
    helperName: string;
    otherPersonPhone: string;
  }>();

  // When opened from a notification, name params won't be present — fetch them
  const skip = !!(helperName && helperName !== "Chat");
  const { currentData, isLoading } = useGetErrandByIdQuery(errandId!, { skip });

  const resolvedName =
    helperName && helperName !== "Chat"
      ? helperName
      : currentData?.errand?.helper
        ? `${currentData.errand.helper.firstName} ${currentData.errand.helper.lastName}`
        : "Chat";

  const resolvedPhone =
    otherPersonPhone ?? currentData?.errand?.helper?.phone ?? undefined;

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <ChatScreen
      errandId={errandId}
      otherPersonName={resolvedName}
      otherPersonPhone={resolvedPhone}
    />
  );
}
