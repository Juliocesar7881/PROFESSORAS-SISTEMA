import { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

type State = { error: Error | null };

export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[mobile] unexpected screen failure", {
      name: error.name,
      message: error.message.slice(0, 240),
      componentStack: info.componentStack?.slice(0, 600),
    });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.screen}>
        <Text accessibilityRole="header" style={styles.title}>Nao foi possivel abrir esta tela</Text>
        <Text style={styles.text}>Seu rascunho continua protegido. Tente abrir a tela novamente.</Text>
        <Pressable accessibilityRole="button" onPress={() => this.setState({ error: null })} style={styles.button}>
          <Text style={styles.buttonText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, backgroundColor: colors.background },
  title: { textAlign: "center", fontSize: 21, fontWeight: "900", color: colors.text },
  text: { maxWidth: 330, marginTop: 8, textAlign: "center", fontSize: 14, lineHeight: 21, fontWeight: "600", color: colors.muted },
  button: { minHeight: 48, marginTop: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 22, borderRadius: 9, backgroundColor: colors.primary },
  buttonText: { color: "white", fontWeight: "900" },
});
