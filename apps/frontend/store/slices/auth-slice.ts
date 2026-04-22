import { User } from "@/types";
import { saveToken, deleteToken } from "@/utils/secure-store";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

export type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
};

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>,
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    updateUserState: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { setCredentials, logout, updateUserState } = authSlice.actions;

/**
 * Thunk: persist login credentials to the OS keychain and dispatch
 * setCredentials. deleteToken is awaited before saveToken so any stale
 * token from a prior session can never linger alongside the new one.
 * Payload: { user, token } obtained from the login/signup API call.
 */
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials: { user: User; token: string }, { dispatch }) => {
    await deleteToken();
    await saveToken(credentials.token);
    dispatch(setCredentials(credentials));
  },
);

/**
 * Thunk: clear the keychain token and reset the auth slice. Dispatching
 * the plain `logout` action alone would leave the token on disk and the
 * next app launch would silently re-authenticate.
 */
export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch }) => {
    await deleteToken();
    dispatch(logout());
  },
);
export default authSlice.reducer;
