import * as Haptics from "expo-haptics";
import { Redirect, Tabs } from "expo-router";
import { BookOpenText, Plus, UsersRound } from "lucide-react-native";
import { Easing, StyleSheet, View } from "react-native";

import { AppHeader } from "../../src/components/AppHeader";
import { useApp } from "../../src/providers/AppProvider";
import { useReducedMotion } from "../../src/hooks/useReducedMotion";
import { colors } from "../../src/theme";

export default function TabsLayout() {
  const { token } = useApp();
  const reducedMotion = useReducedMotion();
  if (!token) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenListeners={{
        tabPress: () => { void Haptics.selectionAsync(); },
      }}
      screenOptions={{
        header: () => <AppHeader />,
        animation: reducedMotion ? "none" : "shift",
        transitionSpec: {
          animation: "timing",
          config: { duration: 220, easing: Easing.out(Easing.cubic) },
        },
        lazy: false,
        freezeOnBlur: false,
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 76,
          paddingTop: 8,
          paddingBottom: 8,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
          shadowColor: colors.shadow,
          shadowOpacity: 0.08,
          shadowRadius: 14,
          elevation: 12,
        },
        tabBarItemStyle: { minHeight: 54, marginHorizontal: 4, borderRadius: 14 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "800", letterSpacing: 0 },
      }}
    >
      <Tabs.Screen
        name="registros"
        options={{
          title: "Registros",
          tabBarIcon: ({ color, size }) => <BookOpenText size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="novo"
        options={{
          title: "Novo",
          tabBarItemStyle: styles.newItem,
          tabBarIcon: () => (
            <View style={styles.newButton}>
              <Plus size={28} color="white" strokeWidth={2.5} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="gestao"
        options={{
          title: "Gestao",
          tabBarIcon: ({ color, size }) => <UsersRound size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  newItem: { minHeight: 58, marginTop: -15, marginHorizontal: 4, borderRadius: 18 },
  newButton: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: colors.surface,
    borderRadius: 27,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 8,
  },
});
