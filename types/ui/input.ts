import { ViewStyle, TextStyle } from "react-native";

export type InputProps = {
  label?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  leftIcon?: React.ReactNode;
};
