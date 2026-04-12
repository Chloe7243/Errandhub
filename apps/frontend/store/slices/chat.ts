import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type Message = {
  id: string;
  senderId: string;
  content?: string;
  imageUrl?: string;
  createdAt: string;
};

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
      state.messagesByErrand[errandId].push(message);
    },
    clearMessages(state, action: PayloadAction<string>) {
      delete state.messagesByErrand[action.payload];
    },
  },
});

export const { addMessage, clearMessages } = chatSlice.actions;
export default chatSlice.reducer;
