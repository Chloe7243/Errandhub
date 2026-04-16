import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type HelperProfile = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  completedCount?: number;
};

export type ErrandRequestPayload = {
  errandId: string;
  title: string;
  description: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupReference?: string | null;
  suggestedPrice: number;
  type: string;
  requester: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
  expiresAt: string;
};

export type CounterOfferPayload = {
  errandId: string;
  helper: HelperProfile;
  amount: number;
  expiresAt: string;
};

type MatchingState = {
  helperRequest: ErrandRequestPayload | null;
  counterOffer: CounterOfferPayload | null;
  expiredErrandId: string | null;
  assignedErrandId: string | null;
};

const initialState: MatchingState = {
  helperRequest: null,
  counterOffer: null,
  expiredErrandId: null,
  assignedErrandId: null,
};

const matchingSlice = createSlice({
  name: "matching",
  initialState,
  reducers: {
    setHelperRequest(state, action: PayloadAction<ErrandRequestPayload>) {
      state.helperRequest = action.payload;
    },
    clearHelperRequest(state) {
      state.helperRequest = null;
    },
    setCounterOffer(state, action: PayloadAction<CounterOfferPayload>) {
      state.counterOffer = action.payload;
    },
    clearCounterOffer(state) {
      state.counterOffer = null;
    },
    setErrandExpired(state, action: PayloadAction<{ errandId: string }>) {
      state.expiredErrandId = action.payload.errandId;
    },
    clearErrandExpired(state) {
      state.expiredErrandId = null;
    },
    setErrandAssigned(state, action: PayloadAction<{ errandId: string }>) {
      state.assignedErrandId = action.payload.errandId;
    },
    clearErrandAssigned(state) {
      state.assignedErrandId = null;
    },
    resetMatching(state) {
      state.helperRequest = null;
      state.counterOffer = null;
      state.expiredErrandId = null;
      state.assignedErrandId = null;
    },
  },
});

export const {
  setHelperRequest,
  clearHelperRequest,
  setCounterOffer,
  clearCounterOffer,
  setErrandExpired,
  clearErrandExpired,
  setErrandAssigned,
  clearErrandAssigned,
  resetMatching,
} = matchingSlice.actions;

export default matchingSlice.reducer;
