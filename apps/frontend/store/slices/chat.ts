import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type Message = {
  id: string;
  senderId: string;
  content?: string;
  imageUrl?: string;
  createdAt: string;
};

// Keyed by errandId because chat threads are scoped to an errand — once the
// errand terminates the thread is archived with it. Holding this in redux
// (rather than only on the socket) lets screens render instantly when
// re-mounted and supports optimistic sends.
type ChatState = {
  messagesByErrand: Record<string, Message[]>;
};

const initialState: ChatState = {
  messagesByErrand: {},
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage(
      state,
      action: PayloadAction<{ errandId: string; message: Message }>,
    ) {
      const { errandId, message } = action.payload;
      if (!state.messagesByErrand[errandId]) {
        state.messagesByErrand[errandId] = [];
      }
      // Deduplicate by id to avoid double-delivery
      const exists = state.messagesByErrand[errandId].some(
        (m) => m.id === message.id,
      );
      if (!exists) {
        state.messagesByErrand[errandId].push(message);
      }
    },
    setMessages(
      state,
      action: PayloadAction<{ errandId: string; messages: Message[] }>,
    ) {
      const { errandId, messages } = action.payload;
      state.messagesByErrand[errandId] = messages;
    },
    clearMessages(state, action: PayloadAction<string>) {
      delete state.messagesByErrand[action.payload];
    },
  },
});

export const { addMessage, setMessages, clearMessages } = chatSlice.actions;
export default chatSlice.reducer;
