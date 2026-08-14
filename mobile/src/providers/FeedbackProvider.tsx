import * as Haptics from "expo-haptics";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../theme";

type FeedbackTone = "neutral" | "success" | "warning" | "danger";
type FeedbackOptions = {
  tone?: FeedbackTone;
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
  duration?: number;
};
type FeedbackState = FeedbackOptions & { id: number; message: string };

const FeedbackContext = createContext<((message: string, options?: FeedbackOptions) => void) | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, options: FeedbackOptions = {}) => {
    if (timer.current) clearTimeout(timer.current);
    const next = { id: Date.now(), message, ...options };
    setFeedback(next);
    const haptic = options.tone === "danger"
      ? Haptics.NotificationFeedbackType.Error
      : options.tone === "warning"
        ? Haptics.NotificationFeedbackType.Warning
        : options.tone === "success"
          ? Haptics.NotificationFeedbackType.Success
          : null;
    if (haptic) void Haptics.notificationAsync(haptic);
    timer.current = setTimeout(() => setFeedback(null), options.duration ?? 3600);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <FeedbackContext.Provider value={show}>
      <View style={styles.root}>
        {children}
        {feedback ? (
          <Animated.View
            entering={FadeInDown.duration(180)}
            exiting={FadeOutDown.duration(150)}
            style={[
              styles.toast,
              { bottom: Math.max(insets.bottom, 12) + 76 },
              feedback.tone === "success" && styles.success,
              feedback.tone === "warning" && styles.warning,
              feedback.tone === "danger" && styles.danger,
            ]}
          >
            <Text accessibilityLiveRegion="polite" style={styles.message}>{feedback.message}</Text>
            {feedback.actionLabel && feedback.onAction ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  const action = feedback.onAction;
                  setFeedback(null);
                  void action?.();
                }}
                style={styles.action}
              >
                <Text style={styles.actionText}>{feedback.actionLabel}</Text>
              </Pressable>
            ) : null}
          </Animated.View>
        ) : null}
      </View>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error("useFeedback must be used inside FeedbackProvider");
  return context;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  toast: {
    position: "absolute",
    left: 14,
    right: 14,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 15,
    backgroundColor: colors.text,
    shadowColor: colors.shadow,
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 1000,
  },
  success: { backgroundColor: colors.success },
  warning: { backgroundColor: colors.warning },
  danger: { backgroundColor: colors.danger },
  message: { flex: 1, color: "white", fontSize: 13, lineHeight: 18, fontWeight: "800" },
  action: { minHeight: 38, justifyContent: "center", paddingHorizontal: 5 },
  actionText: { color: "white", fontSize: 12, fontWeight: "900", textDecorationLine: "underline" },
});
