import { forwardRef, useState } from "react";
import { StyleSheet, TextInput, type TextInputProps } from "react-native";

import { colors } from "../theme";

export const AppTextInput = forwardRef<TextInput, TextInputProps>(function AppTextInput(
  { autoCapitalize = "sentences", autoCorrect = true, multiline, onBlur, onFocus, style, ...props },
  ref,
) {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      ref={ref}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      cursorColor={colors.primary}
      multiline={multiline}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      placeholderTextColor="#9693A7"
      selectionColor={colors.primaryLight}
      style={[styles.input, multiline && styles.multiline, focused && styles.focused, style]}
      {...props}
    />
  );
});

const styles = StyleSheet.create({
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
  },
  multiline: {
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: "top",
  },
  focused: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
});
