import BackButton from "@/components/ui/back-button";
import Input from "@/components/ui/input";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useForgetPasswordMutation } from "@/store/api";
import { useAppDispatch } from "@/store/hooks";
import { loginUser } from "@/store/slices";
import { ForgetPasswordForm, forgetPasswordSchema } from "@errandhub/shared";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Toast } from "react-native-toast-message/lib/src/Toast";

const ForgetPassword = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];

  const [forgetPassword, { isLoading }] = useForgetPasswordMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgetPasswordForm>({
    resolver: zodResolver(forgetPasswordSchema),
  });

  const onSubmit = async (data: ForgetPasswordForm) => {
    if (isLoading) return;
    const response = await forgetPassword(data).unwrap();
    dispatch(loginUser({ user: response.user, token: response.token }));
    router.push("/(auth)/login");
    Toast.show({
      type: "success",
      text1: "Password reset email sent",
      text2: "Please check your inbox for the reset link.",
    });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <BackButton />
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>
                Reset Password
              </Text>

              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {
                  "Enter your email address and we'll send you a link to reset your password."
                }
              </Text>
            </View>

            <View style={styles.form}>
              <Controller
                control={control}
                name="email"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="Email"
                    placeholder="Enter your email"
                    value={value}
                    keyboardType="email-address"
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.email?.message}
                    leftIcon={
                      <Ionicons
                        name="mail-outline"
                        size={18}
                        color={colors.textTertiary}
                      />
                    }
                  />
                )}
              />
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={handleSubmit(onSubmit)}
              >
                {isLoading ? (
                  <LoadingSpinner color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Reset Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default ForgetPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    padding: 24,
    gap: 32,
  },
  header: {
    display: "flex",
    gap: 8,
  },
  headerText: {
    display: "flex",
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
  },
  form: {
    gap: 20,
  },
  forgot: {
    fontSize: 13,
    textAlign: "right",
  },
  actions: {
    gap: 16,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    textAlign: "center",
    fontSize: 14,
  },
});
