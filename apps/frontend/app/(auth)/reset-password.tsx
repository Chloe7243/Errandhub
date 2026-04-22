import { useLocalSearchParams, useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import Input from "@/components/ui/input";
import Toast from "react-native-toast-message";
import { useResetPasswordMutation } from "@/store/api";

// Defined inline (rather than reusing shared/resetPasswordSchema) because
// the UI form has a `confirmPassword` field that we validate client-side
// only — the server never sees it, so it doesn't belong in the shared
// schema used by the API.
const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  // Reset token arrives via a deep link param from the email — the
  // backend's /reset-password endpoint is what actually validates it.
  const { token } = useLocalSearchParams() as { token: string };
  const colors = Colors[colorScheme ?? "dark"];

  const [resetPassword] = useResetPasswordMutation();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    try {
      await resetPassword({
        token,
        password: data.password,
      }).unwrap();
      Toast.show({ type: "success", text1: "Password reset successfully" });
    } catch (err) {
      Toast.show({ type: "error", text1: "Invalid or expired reset link" });
    } finally {
      // Always return to login afterwards — whether the reset succeeded or
      // the token was rejected, the single-use reset link is now spent.
      router.replace("/(auth)/login");
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Reset Password
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter your new password below
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="password"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="New Password"
                placeholder="Enter new password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                secureTextEntry
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Confirm Password"
                placeholder="Confirm new password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
                secureTextEntry
              />
            )}
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            <Text style={styles.buttonText}>
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ResetPassword;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: "center", gap: 32 },
  header: { gap: 8 },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { fontSize: 15 },
  form: { gap: 16 },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
