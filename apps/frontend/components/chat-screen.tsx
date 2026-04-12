// components/chat-screen.tsx
import Avatar from "@/components/avatar";
import BackButton from "@/components/ui/back-button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addMessage } from "@/store/slices/chat";
import { User } from "@/types";
import { connectSocket, getSocket } from "@/utils/socket";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Message = {
  id: string;
  senderId: string;
  content?: string;
  imageUrl?: string;
  createdAt: string;
};

type ChatScreenProps = {
  errandId: string;
  otherPersonName: string;
  otherPersonPhone?: string;
};

const ChatScreen = ({ errandId, otherPersonName, otherPersonPhone }: ChatScreenProps) => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const flatListRef = useRef<FlatList>(null);
  const colors = Colors[colorScheme ?? "dark"];
  const dispatch = useAppDispatch();
  const [input, setInput] = useState("");
  const messages = useAppSelector(
    (state) => state.chat.messagesByErrand[errandId] ?? [],
  ) as Message[];
  const user = useAppSelector((state) => state.auth.user) as User;

  const [firstName, lastName] = otherPersonName.split(" ");

  useEffect(() => {
    let mounted = true;
    const handleReceiveMessage = (message: Message) => {
      if (!mounted) return;
      dispatch(addMessage({ errandId, message }));
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    };

    const setup = async () => {
      const socket = await connectSocket();
      socket.emit("join_room", errandId);
      socket.on("receive_message", handleReceiveMessage);
    };
    setup();
    return () => {
      mounted = false;
      const socket = getSocket();
      socket?.emit("leave_room", errandId);
      socket?.off("receive_message", handleReceiveMessage);
    };
  }, [errandId]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const socket = getSocket();
    socket?.emit("send_message", { errandId, content: input.trim() });
    setInput("");
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.userId;
    return (
      <View style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
        {!isMe && (
          <Avatar
            firstName={firstName ?? "?"}
            lastName={lastName ?? ""}
            size={28}
          />
        )}
        <View style={{ maxWidth: "70%", gap: 4 }}>
          {item.imageUrl && (
            <Image
              source={{ uri: item.imageUrl }}
              style={[styles.imageMessage, { borderColor: colors.border }]}
              resizeMode="cover"
            />
          )}
          {item.content && (
            <View
              style={[
                styles.bubble,
                {
                  backgroundColor: isMe ? colors.primary : colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  { color: isMe ? "#fff" : colors.text },
                ]}
              >
                {item.content}
              </Text>
            </View>
          )}
          <Text
            style={[
              styles.time,
              {
                color: colors.textTertiary,
                textAlign: isMe ? "right" : "left",
              },
            ]}
          >
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
              paddingTop: insets.top + 10,
            },
          ]}
        >
          <BackButton />
          <View style={styles.headerInfo}>
            <View style={styles.avatarContainer}>
              <Avatar
                firstName={firstName ?? "?"}
                lastName={lastName ?? ""}
                size={36}
              />
              <View>
                <Text style={[styles.helperName, { color: colors.text }]}>
                  {otherPersonName}
                </Text>
                <Text style={[styles.helperStatus, { color: colors.success }]}>
                  Active
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.call, { backgroundColor: otherPersonPhone ? colors.primary : colors.border }]}
              onPress={() => otherPersonPhone && Linking.openURL(`tel:${otherPersonPhone}`)}
              disabled={!otherPersonPhone}
            >
              <Ionicons name="call-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={[styles.messageList, { flexGrow: 1 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text
                style={[styles.emptyChatText, { color: colors.textTertiary }]}
              >
                No messages yet — say hello!
              </Text>
            </View>
          }
        />

        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom || 12,
            },
          ]}
        >
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons
              name="image-outline"
              size={24}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.textTertiary}
            style={[
              styles.input,
              {
                backgroundColor: colors.backgroundSecondary,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: input.trim() ? colors.primary : colors.border,
              },
            ]}
            onPress={sendMessage}
            disabled={!input.trim()}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
  },
  headerInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  helperName: { fontSize: 15, fontWeight: "600" },
  helperStatus: { fontSize: 12 },
  messageList: { padding: 16, gap: 12 },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 8,
  },
  bubbleRowMe: { flexDirection: "row-reverse" },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  imageMessage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    borderWidth: 1,
  },
  time: { fontSize: 11, marginHorizontal: 4 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
  },
  iconButton: { paddingBottom: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  call: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 8,
    borderRadius: 10,
  },
  emptyChat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyChatText: { fontSize: 14 },
});
