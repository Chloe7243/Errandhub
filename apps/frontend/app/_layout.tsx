/* eslint-disable react-hooks/exhaustive-deps */
import { store } from "@/store";
import { User } from "@/types/user";
import { jwtDecode } from "jwt-decode";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { SplashScreen, Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { Provider } from "react-redux";
import Toast from "react-native-toast-message";
import { getToken, getValue } from "@/utils/secure-store";
import { AuthState, loginUser } from "@/store/slices";
import { setThemePreference, ThemePreference } from "@/store/slices/theme";

const THEME_KEY = "theme_preference";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "index",
};

export default function RootLayout() {
  return (
    <Provider store={store}>
      <RootLayoutNav />
    </Provider>
  );
}

function RootLayoutNav() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  const { isAuthenticated, user } = useAppSelector(
    (state) => state.auth,
  ) as AuthState;

  useEffect(() => {
    async function prepare() {
      try {
        const [token, savedTheme] = await Promise.all([
          getToken(),
          getValue(THEME_KEY),
        ]);
        if (token) {
          const user = jwtDecode<User>(token);
          dispatch(loginUser({ user, token }));
        }
        if (savedTheme) {
          dispatch(setThemePreference(savedTheme as ThemePreference));
        }
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync(); // hide when ready
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.replace("/");
    } else if (isAuthenticated && !user?.role) {
      router.replace("/role-selection");
    } else if (isAuthenticated && user?.role) {
      router.replace(`/${user.role}/home`);
    }
  }, [isAuthenticated, user?.role]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(protected)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
      <Toast />
    </ThemeProvider>
  );
}
