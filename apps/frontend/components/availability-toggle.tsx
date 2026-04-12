import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
} from "@/store/api/user";
import { Ionicons } from "@expo/vector-icons";
import {
  Switch,
  Text,
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from "react-native";
import { displayErrorMessage } from "@/utils/errors";

type Props = {
  value?: boolean;
  controlled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  onChange?: (val: boolean) => void;
  onValueChange?: (val: boolean) => void;
};

const AvailabilityToggle = ({
  value,
  onChange,
  onValueChange,
  containerStyle,
  controlled = false,
}: Props) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const { currentData: settingsData } = useGetSettingsQuery(null, {
    skip: controlled,
  });
  const [updateSettings] = useUpdateSettingsMutation();

  const isAvailable = controlled
    ? (value ?? false)
    : (settingsData?.settings?.isAvailable ?? false);

  const handleToggle = async (val: boolean) => {
    if (controlled) {
      onChange?.(val);
    } else {
      try {
        await updateSettings({ isAvailable: val }).unwrap();
        onValueChange?.(val);
      } catch (err) {
        displayErrorMessage(err);
      }
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border,
        },
        containerStyle,
      ]}
    >
      <View
        style={[styles.iconWrapper, { backgroundColor: colors.success + "15" }]}
      >
        <Ionicons name="radio-outline" size={16} color={colors.success} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: colors.text }]}>
          {isAvailable ? "You are available" : "You are unavailable"}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {isAvailable
            ? "Nearby tasks will be sent to you"
            : "Toggle on to start receiving tasks"}
        </Text>
      </View>
      <Switch
        value={isAvailable}
        onValueChange={handleToggle}
        trackColor={{ false: colors.border, true: colors.success }}
        thumbColor="#fff"
      />
    </View>
  );
};

export default AvailabilityToggle;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  subtitle: { fontSize: 12 },
});
