import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../src/theme";

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <View style={styles.screen}>
      <Text accessibilityRole="header" style={styles.title}>Tela nao encontrada</Text>
      <Text style={styles.text}>Este caminho nao existe mais no Pequenos Passos.</Text>
      <Pressable accessibilityRole="button" onPress={() => router.replace("/")} style={styles.button}>
        <ArrowLeft size={18} color="white" />
        <Text style={styles.buttonText}>Voltar ao aplicativo</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: "900", color: colors.text },
  text: { marginTop: 8, textAlign: "center", fontSize: 14, color: colors.muted, fontWeight: "600" },
  button: { minHeight: 48, marginTop: 20, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 18, borderRadius: 9, backgroundColor: colors.primary },
  buttonText: { color: "white", fontWeight: "900" },
});
