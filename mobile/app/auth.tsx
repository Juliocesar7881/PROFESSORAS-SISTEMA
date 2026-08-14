import { Redirect, useLocalSearchParams } from "expo-router";
import { AlertCircle } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useApp } from "../src/providers/AppProvider";
import { colors } from "../src/theme";

export default function MobileAuthCallbackScreen() {
  const params = useLocalSearchParams<{ code?: string | string[]; error?: string | string[] }>();
  const { token, completeLoginCode } = useApp();
  const started = useRef(false);
  const [error, setError] = useState("");
  const code = Array.isArray(params.code) ? params.code[0] : params.code;

  useEffect(() => {
    if (!code || started.current || token) return;
    started.current = true;
    void completeLoginCode(code).catch((cause) => {
      setError(cause instanceof Error ? cause.message : "Nao foi possivel concluir o acesso.");
    });
  }, [code, completeLoginCode, token]);

  if (token) return <Redirect href="/(tabs)/novo" />;

  return (
    <View style={styles.screen}>
      {error ? <AlertCircle size={28} color={colors.warning} /> : <ActivityIndicator size="large" color={colors.primary} />}
      <Text accessibilityRole="header" style={styles.title}>{error ? "Acesso nao concluido" : "Concluindo seu acesso"}</Text>
      <Text style={styles.text}>
        {error || "Estamos conectando sua conta Google ao Pequenos Passos."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, backgroundColor: colors.background },
  title: { marginTop: 16, fontSize: 21, fontWeight: "900", color: colors.text },
  text: { maxWidth: 300, marginTop: 7, textAlign: "center", fontSize: 14, lineHeight: 21, fontWeight: "600", color: colors.muted },
});
