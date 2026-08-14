import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";

import { useReducedMotion } from "../hooks/useReducedMotion";

export function AppBottomSheet({
  visible,
  onClose,
  children,
  contentStyle,
  accessibilityLabel,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      return;
    }

    if (!mounted) return;
    const animation = Animated.timing(progress, {
      toValue: 0,
      duration: reducedMotion ? 1 : 170,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) setMounted(false);
    });
    return () => animation.stop();
  }, [mounted, progress, reducedMotion, visible]);

  useEffect(() => {
    if (!mounted || !visible) return;
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: reducedMotion ? 1 : 230,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [mounted, progress, reducedMotion, visible]);

  if (!mounted) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Animated.View
          pointerEvents="none"
          style={[styles.backdrop, { opacity: progress }]}
        />
        <Pressable
          accessibilityLabel={accessibilityLabel || "Fechar painel"}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          style={[
            styles.content,
            contentStyle,
            {
              opacity: progress,
              transform: [{
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [reducedMotion ? 0 : 34, 0],
                }),
              }],
            },
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(23, 33, 63, 0.36)",
  },
  content: {
    overflow: "hidden",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: "white",
  },
});
