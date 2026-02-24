import BackButton from "@/components/ui/back-button";
import Input from "@/components/ui/input";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/slices";
import { LoginForm, loginSchema } from "@/types/login";
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

const Login = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const dispatch = useAppDispatch();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginForm) => {
    console.log(data);
    // call your API here
    dispatch(setCredentials({ user: { firstName: "John", lastName: "Doe" } }));
    router.push("/role-selection");
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
                Welcome Back
              </Text>

              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Log in to continue to ErrandHub
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

              <Controller
                control={control}
                name="password"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="Password"
                    placeholder="Enter your password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.password?.message}
                    secureTextEntry
                    leftIcon={
                      <Ionicons
                        name="lock-closed-outline"
                        size={18}
                        color={colors.textTertiary}
                      />
                    }
                  />
                )}
              />

              <TouchableOpacity onPress={() => {}}>
                <Text style={[styles.forgot, { color: colors.primary }]}>
                  Forgot password?
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={handleSubmit(onSubmit)}
              >
                <Text style={styles.buttonText}>Log In</Text>
              </TouchableOpacity>

              <Text style={[styles.footer, { color: colors.textSecondary }]}>
                {"Don't have an account? "}
                <Text
                  style={{ color: colors.primary, fontWeight: "600" }}
                  onPress={() => router.push("/(auth)/signup")}
                >
                  Sign Up
                </Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default Login;

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
