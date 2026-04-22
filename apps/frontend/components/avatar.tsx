import { Colors } from "@/constants/theme";
import { Image, View, Text, StyleSheet } from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";

type Props = {
  uri?: string;
  firstName?: string;
  lastName?: string;
  size?: number;
};

/**
 * Circular profile image with an initials fallback.
 *
 * Renders the uploaded image at `uri` when present, otherwise draws a
 * coloured disc containing the user's initials. Avoids the standard
 * broken-image placeholder and keeps list rows visually aligned whether
 * or not the user has uploaded a photo. `size` drives both the disc and
 * text sizing via a 0.35 ratio.
 */
const Avatar = ({ uri, firstName = "", lastName = "", size = 40 }: Props) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];

  const initials =
    `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();

  return uri ? (
    <Image
      source={{ uri }}
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    />
  ) : (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primary,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.35 }]}>
        {initials}
      </Text>
    </View>
  );
};

export default Avatar;

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  initials: {
    color: "#fff",
    fontWeight: "600",
  },
});
