import BackButton from "@/components/ui/back-button";
import Input from "@/components/ui/input";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useCreateAccountMutation } from "@/store/api";
import { useAppDispatch } from "@/store/hooks";
import { loginUser } from "@/store/slices";
import { displayErrorMessage } from "@/utils/errors";
import { SignUpForm, signUpSchema } from "@errandhub/shared";
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
import Toast from "react-native-toast-message";

const SignUp = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];

  const [createAccount, { isLoading }] = useCreateAccountMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
  });

  async function onSubmit(data: SignUpForm) {
    if (isLoading) return;
    try {
      const response = await createAccount(data).unwrap();
      Toast.show({
        type: "success",
        text1: "Account created successfully",
      });
      dispatch(loginUser({ user: response.user, token: response.token }));
    } catch (error) {
      console.error("Error creating account:", error);
      displayErrorMessage(error);
    }
  }

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

            <View style={styles.form}>
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>
                  Create Account
                </Text>
                <Text
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                >
                  Sign up with your university email
                </Text>
              </View>

              <Controller
                control={control}
                name="firstName"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="First Name"
                    placeholder="Enter your first name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.firstName?.message}
                    leftIcon={
                      <Ionicons
                        name="person-outline"
                        size={18}
                        color={colors.textTertiary}
                      />
                    }
                  />
                )}
              />

              <Controller
                control={control}
                name="lastName"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="Last Name"
                    placeholder="Enter your last name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.lastName?.message}
                    leftIcon={
                      <Ionicons
                        name="person-outline"
                        size={18}
                        color={colors.textTertiary}
                      />
                    }
                  />
                )}
              />

              <Controller
                control={control}
                name="email"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="University Email"
                    placeholder="you@university.ac.uk"
                    keyboardType="email-address"
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
                name="phone"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="Phone Number"
                    placeholder="Enter your phone number"
                    value={value}
                    keyboardType="phone-pad"
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.phone?.message}
                    leftIcon={
                      <Ionicons
                        name="call-outline"
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
                    placeholder="Create a password"
                    keyboardType="visible-password"
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
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={isLoading ? undefined : handleSubmit(onSubmit)}
              >
                {isLoading ? (
                  <LoadingSpinner color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              <Text style={[styles.footer, { color: colors.textSecondary }]}>
                {"Already have an account? "}
                <Text
                  style={{ color: colors.primary, fontWeight: "600" }}
                  onPress={() => router.push("/login")}
                >
                  Log In
                </Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 24,
    gap: 32,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
  },
  form: {
    gap: 16,
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
