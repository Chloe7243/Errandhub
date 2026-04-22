import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setThemePreference, ThemePreference } from "@/store/slices/theme";
import { saveValue } from "@/utils/secure-store";

const THEME_KEY = "theme_preference";

/**
 * Hook that exposes the current theme preference and a setter which both
 * updates redux and persists the new value to SecureStore. Persistence
 * matters because the app reads SecureStore during cold-start bootstrap —
 * before the auth flow has had a chance to hydrate any server-side
 * preferences — so the splash and login screens render in the right mode.
 * Returns { preference, changeTheme }.
 */
export function useThemePreference() {
  const dispatch = useAppDispatch();
  const preference = useAppSelector((state) => state.theme.preference);

  const changeTheme = async (value: ThemePreference) => {
    dispatch(setThemePreference(value));
    await saveValue(THEME_KEY, value);
  };

  return { preference, changeTheme };
}
