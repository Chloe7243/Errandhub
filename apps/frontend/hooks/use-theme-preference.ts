import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setThemePreference, ThemePreference } from "@/store/slices/theme";
import { saveValue } from "@/utils/secure-store";

const THEME_KEY = "theme_preference";

export function useThemePreference() {
  const dispatch = useAppDispatch();
  const preference = useAppSelector((state) => state.theme.preference);

  const changeTheme = async (value: ThemePreference) => {
    dispatch(setThemePreference(value));
    await saveValue(THEME_KEY, value);
  };

  return { preference, changeTheme };
}
