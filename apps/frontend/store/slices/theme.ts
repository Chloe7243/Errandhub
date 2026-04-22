import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// "system" follows the device's light/dark setting; "light"/"dark" override
// it. Stored in redux (and persisted via the theme-preference hook) so
// toggling from the profile screen updates the whole app instantly.
export type ThemePreference = "light" | "dark" | "system";

type ThemeState = {
  preference: ThemePreference;
};

const initialState: ThemeState = {
  preference: "system",
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setThemePreference(state, action: PayloadAction<ThemePreference>) {
      state.preference = action.payload;
    },
  },
});

export const { setThemePreference } = themeSlice.actions;
export default themeSlice.reducer;
