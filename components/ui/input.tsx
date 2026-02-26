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
  leftIcon,
}: InputProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
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
