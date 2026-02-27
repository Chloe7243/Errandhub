import { ViewStyle, TextStyle } from "react-native";

export type InputProps = {
  label?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  error?: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  containerStyle?: ViewStyle;
  wrapperStyle?: ViewStyle;
  inputStyle?: TextStyle;
  leftIcon?: React.ReactNode;
};
