import locationReducer, {
  setPermissionStatus,
  setCoordinates,
  setLocationEnabled,
} from "../../../../apps/frontend/store/slices/location";

describe("location slice", () => {
  it("returns the initial state", () => {
    expect(locationReducer(undefined, { type: "@@INIT" })).toEqual({
      permissionStatus: "unknown",
      coordinates: null,
      locationEnabled: false,
    });
  });

  it("setPermissionStatus updates to granted", () => {
    const state = locationReducer(undefined, setPermissionStatus("granted"));
    expect(state.permissionStatus).toBe("granted");
  });

  it("setPermissionStatus updates to denied", () => {
    const state = locationReducer(undefined, setPermissionStatus("denied"));
    expect(state.permissionStatus).toBe("denied");
  });

  it("setCoordinates stores lat and lng", () => {
    const state = locationReducer(
      undefined,
      setCoordinates({ lat: 51.5074, lng: -0.1278 }),
    );
    expect(state.coordinates).toEqual({ lat: 51.5074, lng: -0.1278 });
  });

  it("setCoordinates accepts null to clear the position", () => {
    let state = locationReducer(
      undefined,
      setCoordinates({ lat: 51.5074, lng: -0.1278 }),
    );
    state = locationReducer(state, setCoordinates(null));
    expect(state.coordinates).toBeNull();
  });

  it("setLocationEnabled sets to true", () => {
    const state = locationReducer(undefined, setLocationEnabled(true));
    expect(state.locationEnabled).toBe(true);
  });

  it("setLocationEnabled sets back to false", () => {
    let state = locationReducer(undefined, setLocationEnabled(true));
    state = locationReducer(state, setLocationEnabled(false));
    expect(state.locationEnabled).toBe(false);
  });
});
