import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { InputProps } from "@/types/ui/input";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * Shared themed text input used across every form.
 *
 * Adds: label rendering, inline error display with red border,
 * optional leading icon, and a built-in show/hide eye toggle for
 * secureTextEntry fields so screens don't need to manage that state. Also
 * supports multiline, keyboard type, custom wrapper/input styles.
 */
const Input = ({
  label,
  placeholder,
  secureTextEntry,
  error,
  value,
  onChangeText,
  onBlur,
  multiline,
  containerStyle,
  inputStyle,
  wrapperStyle,
  keyboardType,
  leftIcon,
}: InputProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  // Tracks visibility of a secure input locally so the eye toggle works
  // without the consumer needing to manage boolean state.
  const [hidden, setHidden] = useState(secureTextEntry);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputWrapper,
          wrapperStyle,
          { backgroundColor: colors.surface },
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          value={value}
          multiline={multiline}
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={hidden}
          style={[
            styles.input,
            {
              borderColor: error ? colors.error : colors.border,
              color: colors.text,
            },
            inputStyle,
          ]}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setHidden((prev) => !prev)}>
            <Ionicons
              name={hidden ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={colors.textTertiary}
              style={styles.iconRight}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
};

export default Input;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 15,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  error: {
    fontSize: 12,
  },
});
