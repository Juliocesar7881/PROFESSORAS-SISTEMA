import { Image } from "expo-image";
import { Redirect } from "expo-router";
import { LogIn, ShieldCheck } from "lucide-react-native";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown, ReduceMotion } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { useApp } from "../../src/providers/AppProvider";
import { colors } from "../../src/theme";

export default function LoginScreen() {
  const { token, login, loginLoading } = useApp();
  if (token) return <Redirect href="/(tabs)/novo" />;

  return (
    <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.screen}>
      <Animated.View entering={FadeIn.duration(260).reduceMotion(ReduceMotion.System)} style={styles.brand}>
        <Image source={require("../../assets/brand-mark.png")} style={styles.brandImage} contentFit="cover" transition={180} />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(70).duration(260).reduceMotion(ReduceMotion.System)} style={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>Pequenos Passos</Text>
        <Text style={styles.description}>
          Registros pedagogicos individuais, protegidos e sempre ao alcance da professora.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Entrar com Google"
          disabled={loginLoading}
          onPress={() => void login()}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, loginLoading && styles.disabled]}
        >
          {loginLoading ? <ActivityIndicator size="small" color="white" /> : <LogIn size={20} color="white" />}
          <Text style={styles.buttonText}>{loginLoading ? "Abrindo Google..." : "Entrar com Google"}</Text>
        </Pressable>
        <View style={styles.security}>
          <ShieldCheck size={17} color={colors.success} />
          <Text style={styles.securityText}>Acesso gratuito. Seus registros ficam privados.</Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    backgroundColor: colors.background,
  },
  brand: {
    width: 112,
    height: 112,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 8,
  },
  brandImage: { width: "100%", height: "100%" },
  content: { width: "100%", maxWidth: 360, alignItems: "center" },
  title: { marginTop: 24, fontSize: 31, fontWeight: "900", color: colors.text },
  description: { marginTop: 9, textAlign: "center", fontSize: 15, lineHeight: 22, color: colors.muted, fontWeight: "600" },
  button: {
    width: "100%",
    minHeight: 52,
    marginTop: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingHorizontal: 24,
    borderRadius: 15,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonPressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  buttonText: { color: "white", fontSize: 15, fontWeight: "900" },
  disabled: { opacity: 0.66 },
  security: { marginTop: 20, flexDirection: "row", alignItems: "center", gap: 7 },
  securityText: { fontSize: 12, color: colors.muted, fontWeight: "700" },
});
