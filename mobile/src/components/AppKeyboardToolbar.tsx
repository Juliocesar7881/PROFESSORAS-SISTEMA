import { KeyboardToolbar } from "react-native-keyboard-controller";

import { colors } from "../theme";

const theme = {
  light: { primary: colors.primary, disabled: "#cfc1ca", background: "#ffffff", ripple: colors.surfaceSoft },
  dark: { primary: colors.primary, disabled: "#cfc1ca", background: "#ffffff", ripple: colors.surfaceSoft },
};

export function AppKeyboardToolbar() {
  return (
    <KeyboardToolbar theme={theme}>
      <KeyboardToolbar.Prev />
      <KeyboardToolbar.Next />
      <KeyboardToolbar.Done text="Concluir" />
    </KeyboardToolbar>
  );
}
