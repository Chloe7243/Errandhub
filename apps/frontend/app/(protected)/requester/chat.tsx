import Avatar from "@/components/avatar";
import BackButton from "@/components/ui/back-button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
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
  text?: string;
  image?: string;
  sender: "me" | "helper";
  time: string;
};

const MOCK_MESSAGES: Message[] = [
  {
    id: "1",
    text: "Hey! I'm on my way to Tesco now.",
    sender: "helper",
    time: "10:01",
  },
  {
    id: "2",
    text: "Great, thanks! Don't forget semi-skimmed milk.",
    sender: "me",
    time: "10:02",
  },
  {
    id: "3",
    text: "Got it. Should I get large or medium eggs?",
    sender: "helper",
    time: "10:03",
  },
  { id: "4", text: "Medium is fine!", sender: "me", time: "10:04" },
];

const Chat = () => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text: input.trim(),
        sender: "me",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setInput("");
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender === "me";
    return (
      <View style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
        {!isMe && <Avatar firstName="Mike" lastName="T" size={28} />}
        <View style={{ maxWidth: "70%", gap: 4 }}>
          {item.image && (
            <Image
              source={{ uri: item.image }}
              style={[styles.imageMessage, { borderColor: colors.border }]}
              resizeMode="cover"
            />
          )}
          {item.text && (
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
                {item.text}
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
            {item.time}
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
        {/* Header */}
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
              <Avatar firstName="Mike" lastName="T" size={36} />
              <View>
                <Text style={[styles.helperName, { color: colors.text }]}>
                  Mike T.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.call, { backgroundColor: colors.primary }]}
              // onPress={() => router.push("/requester/chat")}
            >
              <Ionicons name="call-outline" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
        />

        {/* Input */}
        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom,
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

export default Chat;

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
    display: "flex",
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
  messageList: {
    padding: 16,
    gap: 12,
  },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 8,
  },
  bubbleRowMe: {
    flexDirection: "row-reverse",
  },
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
});
