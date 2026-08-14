import { NavigationBar } from "expo-navigation-bar";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context";

import { AppKeyboardToolbar } from "../src/components/AppKeyboardToolbar";
import { AppErrorBoundary } from "../src/components/AppErrorBoundary";
import { AppProvider, useApp } from "../src/providers/AppProvider";
import { FeedbackProvider } from "../src/providers/FeedbackProvider";
import { useReducedMotion } from "../src/hooks/useReducedMotion";
import { colors } from "../src/theme";

void SplashScreen.preventAutoHideAsync();
WebBrowser.maybeCompleteAuthSession();

function RootNavigator() {
  const { ready } = useApp();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: reducedMotion ? "none" : "slide_from_right",
        animationDuration: 240,
        gestureEnabled: true,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ animation: reducedMotion ? "none" : "fade" }} />
      <Stack.Screen name="(auth)" options={{ animation: reducedMotion ? "none" : "fade" }} />
      <Stack.Screen name="auth" options={{ animation: reducedMotion ? "none" : "fade" }} />
      <Stack.Screen name="(tabs)" options={{ animation: reducedMotion ? "none" : "fade" }} />
      <Stack.Screen name="registro/[id]" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <KeyboardProvider>
        <StatusBar animated style="dark" />
        <NavigationBar hidden={false} style="dark" />
        <FeedbackProvider>
          <AppProvider>
            <AppErrorBoundary>
              <RootNavigator />
              <AppKeyboardToolbar />
            </AppErrorBoundary>
          </AppProvider>
        </FeedbackProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
