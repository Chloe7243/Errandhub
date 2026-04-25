import themeReducer, {
  setThemePreference,
  ThemePreference,
} from "../../../../apps/frontend/store/slices/theme";

describe("theme slice", () => {
  it("returns the initial state", () => {
    expect(themeReducer(undefined, { type: "@@INIT" })).toEqual({
      preference: "system",
    });
  });

  it.each<ThemePreference>(["light", "dark", "system"])(
    "setThemePreference stores '%s'",
    (preference) => {
      const state = themeReducer(undefined, setThemePreference(preference));
      expect(state.preference).toBe(preference);
    },
  );

  it("can switch from one preference to another", () => {
    let state = themeReducer(undefined, setThemePreference("dark"));
    expect(state.preference).toBe("dark");

    state = themeReducer(state, setThemePreference("light"));
    expect(state.preference).toBe("light");

    state = themeReducer(state, setThemePreference("system"));
    expect(state.preference).toBe("system");
  });
});
