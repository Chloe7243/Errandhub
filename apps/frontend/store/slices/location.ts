import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type LocationPermissionStatus = "unknown" | "granted" | "denied";

type Coordinates = { lat: number; lng: number };

// Tracks the device's location permission and last known coordinates so the
// matching flow (helper availability + errand radius filter) can decide
// whether to even attempt a location lookup without re-prompting the user.
type LocationState = {
  permissionStatus: LocationPermissionStatus;
  coordinates: Coordinates | null;
  locationEnabled: boolean;
};

const initialState: LocationState = {
  permissionStatus: "unknown",
  coordinates: null,
  locationEnabled: false,
};

const locationSlice = createSlice({
  name: "location",
  initialState,
  reducers: {
    setPermissionStatus(
      state,
      action: PayloadAction<LocationPermissionStatus>,
    ) {
      state.permissionStatus = action.payload;
    },
    setCoordinates(state, action: PayloadAction<Coordinates | null>) {
      state.coordinates = action.payload;
    },
    setLocationEnabled(state, action: PayloadAction<boolean>) {
      state.locationEnabled = action.payload;
    },
  },
});

export const { setPermissionStatus, setCoordinates, setLocationEnabled } =
  locationSlice.actions;
export default locationSlice.reducer;
