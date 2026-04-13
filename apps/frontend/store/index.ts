import { api } from "./api";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/auth-slice";
import chatReducer from "./slices/chat";
import matchingReducer from "./slices/matching";
import themeReducer from "./slices/theme";
import locationReducer from "./slices/location";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    matching: matchingReducer,
    theme: themeReducer,
    location: locationReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
