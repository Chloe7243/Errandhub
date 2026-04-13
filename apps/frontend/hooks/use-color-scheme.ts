import { useColorScheme as useSystemColorScheme } from "react-native";
import { useAppSelector } from "@/store/hooks";

export function useColorScheme(): "light" | "dark" {
  const preference = useAppSelector((state) => state.theme.preference);
  const systemScheme = useSystemColorScheme() ?? "dark";

  if (preference === "system") return systemScheme;
  return preference;
}
