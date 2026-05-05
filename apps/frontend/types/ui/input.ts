import { ViewStyle, TextStyle, TextInputProps } from "react-native";

export type InputProps = {
  label?: string;
  editable?: boolean;
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
  keyboardType?: TextInputProps["keyboardType"];
};
