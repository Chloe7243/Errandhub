import { ActivityIndicator, StyleSheet, View } from "react-native";

type BaseProps = {
  color?: string;
  fullScreen?: boolean;
};

type SizeProps = BaseProps & {
  size?: "small" | "large";
  customSize?: never;
};

/** Scale multiplier. Recommended range: 1-3 */
type CustomSizeProps = BaseProps & { customSize: number; size?: never };

type Props = SizeProps | CustomSizeProps;

const LoadingSpinner = ({
  color,
  size,
  customSize = 1,
  fullScreen = false,
}: Props) => {
  if (fullScreen) {
    return (
      <View style={[styles.fullScreen]}>
        <ActivityIndicator
          color={color}
          style={{ transform: [{ scale: customSize }] }}
        />
      </View>
    );
  }

  return (
    <ActivityIndicator
      size={size}
      style={{ height: customSize }}
      color={color}
    />
  );
};

export default LoadingSpinner;

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
