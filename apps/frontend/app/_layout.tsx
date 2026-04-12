/* eslint-disable react-hooks/exhaustive-deps */
import { useColorScheme } from "@/hooks/use-color-scheme";
import { store } from "@/store";
import { jwtDecode } from "jwt-decode";
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
import { deleteToken, getToken } from "@/utils/secure-store";
import { connectSocket, getSocket } from "@/utils/socket";
import { AuthState, loginUser } from "@/store/slices";
import {
  setHelperRequest,
  setReviewWindow,
  setCounterOffer,
  setErrandExpired,
  setErrandAssigned,
} from "@/store/slices";
import { User } from "@/types/user";

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
        const token = await getToken();
        if (token) {
          const user = jwtDecode<User>(token);
          dispatch(loginUser({ user, token }));
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

  useEffect(() => {
    if (!isAuthenticated) return;

    let mounted = true;
    const setupSocket = async () => {
      try {
        const socket = await connectSocket();
        if (!mounted) return;

        socket.on("errand_request", (payload) => {
          dispatch(setHelperRequest(payload));
        });

        socket.on("review_window", (payload) => {
          dispatch(setReviewWindow(payload));
          if (user?.role === "requester") {
            router.push(`/requester/errand-details?id=${payload.errandId}`);
          }
        });

        socket.on("counter_offer", (payload) => {
          dispatch(setCounterOffer(payload));
          if (user?.role === "requester") {
            router.push(`/requester/errand-details?id=${payload.errandId}`);
          }
        });

        socket.on("errand_expired", (payload) => {
          dispatch(setErrandExpired(payload));
          if (user?.role === "requester") {
            router.push(`/requester/errand-details?id=${payload.errandId}`);
          }
          Toast.show({
            type: "error",
            text1: "No helpers available",
            text2: "We could not find a helper for your errand.",
          });
        });

        socket.on("errand_assigned", (payload) => {
          dispatch(setErrandAssigned(payload));
          if (user?.role === "helper") {
            router.push(`/helper/task-details?id=${payload.errandId}`);
          }
        });

        socket.on("match_unavailable", (payload) => {
          if (user?.role === "helper") {
            Toast.show({
              type: "info",
              text1: "Match unavailable",
              text2: payload.message,
            });
          }
        });
      } catch (error) {
        console.error("Socket listener setup failed", error);
      }
    };

    setupSocket();

    return () => {
      mounted = false;
      const socket = getSocket();
      socket?.off("errand_request");
      socket?.off("review_window");
      socket?.off("counter_offer");
      socket?.off("errand_expired");
      socket?.off("errand_assigned");
      socket?.off("match_unavailable");
    };
  }, [dispatch, isAuthenticated, router, user?.role]);

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
