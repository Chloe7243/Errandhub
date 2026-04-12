import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type HelperState = {
  declinedErrandIds: string[];
};

const initialState: HelperState = {
  declinedErrandIds: [],
};

const helperSlice = createSlice({
  name: "helper",
  initialState,
  reducers: {
    declineErrand(state, action: PayloadAction<string>) {
      if (!state.declinedErrandIds.includes(action.payload)) {
        state.declinedErrandIds.push(action.payload);
      }
    },
    clearDeclined(state) {
      state.declinedErrandIds = [];
    },
  },
});

export const { declineErrand, clearDeclined } = helperSlice.actions;
export default helperSlice.reducer;
