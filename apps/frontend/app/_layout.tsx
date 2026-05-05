/* eslint-disable react-hooks/exhaustive-deps */
import { LogBox } from "react-native";
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
import Toast, {
  ErrorToast,
  SuccessToast,
  BaseToast,
} from "react-native-toast-message";
import { getToken, getValue } from "@/utils/secure-store";
import { AuthState, loginUser, updateUserState } from "@/store/slices";
import { usersApi } from "@/store/api/user";
import { setThemePreference, ThemePreference } from "@/store/slices/theme";
import { StripeProvider } from "@stripe/stripe-react-native";
import * as Network from "expo-network";

const toastConfig = {
  success: (props: any) => <SuccessToast {...props} text1NumberOfLines={0} />,
  error: (props: any) => <ErrorToast {...props} text1NumberOfLines={0} />,
  info: (props: any) => <BaseToast {...props} text1NumberOfLines={0} />,
};

// Suppress the dev-mode error/warning overlay so it doesn't confuse testers.
// Errors are still logged to the console for debugging.
LogBox.ignoreAllLogs();

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
    (async () => {
      const state = await Network.getNetworkStateAsync();
      if (!state.isConnected || !state.isInternetReachable) {
        Toast.show({
          type: "error",
          text1: "You are currently offline",
          autoHide: false,
          swipeable: true,
        });
      }
    })();
  });

  useEffect(() => {
    async function prepare() {
      try {
        const [token, savedTheme] = await Promise.all([
          getToken(),
          getValue(THEME_KEY),
        ]);
        if (token) {
          // Decode the JWT locally to hydrate the Redux store without a network
          // round-trip. Token validity is still enforced by the API on protected
          // requests. avatarUrl and other profile fields in the JWT can be stale
          // (they were baked in at login time), so we immediately fetch fresh
          // profile data and merge it in — that way avatar changes persist across
          // app restarts without requiring a re-login.
          const user = jwtDecode<User>(token);
          dispatch(loginUser({ user, token }));

          // Fire-and-forget: refresh profile data from the server so stale JWT
          // fields (e.g. avatarUrl) reflect the latest DB state. Failures are
          // silently ignored — offline startup still works via the JWT-decoded data.
          const result = await dispatch(
            usersApi.endpoints.getUserDetails.initiate(undefined, { forceRefetch: true }),
          );
          if (result.data?.user) {
            dispatch(updateUserState(result.data.user));
          }
        }
        if (savedTheme) {
          dispatch(setThemePreference(savedTheme as ThemePreference));
        }
      } finally {
        // Always reach this block so the splash screen doesn't hang on error.
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  // Guard on isReady prevents a redirect before the stored token has been read.
  // Without this, an authenticated user would be flashed to the sign-in screen
  // for one render cycle while the async prepare() is still running.
  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.replace("/");
    } else if (isAuthenticated && !user?.role) {
      // Authenticated but no role chosen yet — resume the onboarding step.
      router.replace("/role-selection");
    } else if (isAuthenticated && user?.role) {
      router.replace(`/${user.role}/home`);
    }
  }, [isAuthenticated, user?.role]);

  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
      merchantIdentifier="merchant.com.errandhub"
    >
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(protected)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
        <Toast config={toastConfig} />
      </ThemeProvider>
    </StripeProvider>
  );
}
