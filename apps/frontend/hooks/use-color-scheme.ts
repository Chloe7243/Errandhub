import { useColorScheme as useSystemColorScheme } from "react-native";
import { useAppSelector } from "@/store/hooks";

/**
 * Resolve the active light/dark colour scheme.
 *
 * Combines the user's saved preference (redux theme slice) with the OS
 * setting from react-native: when the preference is "system" the device
 * value wins; otherwise the explicit override is used. Falls back to "dark"
 * before React Native reports the initial OS value so the first paint
 * matches the brand palette instead of flashing light.
 */
export function useColorScheme(): "light" | "dark" {
  const preference = useAppSelector((state) => state.theme.preference);
  const systemScheme = useSystemColorScheme() ?? "dark";

  if (preference === "system") return systemScheme;
  return preference;
}
