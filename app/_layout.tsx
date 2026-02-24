/* eslint-disable react-hooks/exhaustive-deps */
import { useColorScheme } from "@/hooks/use-color-scheme";
import { store } from "@/store";
import { useAppSelector } from "@/store/hooks";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { Provider } from "react-redux";

// SplashScreen.preventAutoHideAsync();

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
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    const inProtected = segments[0] === "(protected)";
    if (!isAuthenticated && inProtected) {
      router.replace("/");
    } else if (isAuthenticated && !inProtected) {
      router.replace("/(protected)/role-selection");
    }
  }, [isAuthenticated, segments]);

  // useEffect(() => {
  //   async function prepare() {
  //     try {
  //       setTimeout(() => {}, 2000);
  //       // Load fonts, check auth token, anything you need here
  //     } finally {
  //       await SplashScreen.hideAsync(); // hide when ready
  //     }
  //   }
  //   prepare();
  // }, []);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(protected)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
