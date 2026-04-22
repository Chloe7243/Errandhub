import { useStripe } from "@stripe/stripe-react-native";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGetSetupIntentMutation } from "@/store/api/payment";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import Toast from "react-native-toast-message";
import { useAppDispatch } from "@/store/hooks";
import { api } from "@/store/api";
import { displayErrorMessage } from "@/utils/errors";

/**
 * Button that opens Stripe's PaymentSheet so the user can save a new card.
 *
 * Flow: request a SetupIntent from our backend, init/present the native
 * sheet with the client secret, then invalidate the saved-cards cache so
 * any rendered card list refetches. A "Canceled" error from Stripe (user
 * dismissed the sheet) is deliberately ignored — only real failures
 * surface as a toast.
 */
const AddPaymentMethodButton = () => {
  const dispatch = useAppDispatch();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const [getSetupIntent, { isLoading: isAddingCard }] =
    useGetSetupIntentMutation();

  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  // Stripe's PaymentSheet flow: request a SetupIntent from our backend,
  // init/present the native sheet with that client secret, then invalidate
  // the saved-cards cache so the card list refetches. "Canceled" is not
  // treated as an error because it's the user dismissing the sheet.
  const handleAddCard = async () => {
    try {
      const { clientSecret } = await getSetupIntent().unwrap();
      const { error: initError } = await initPaymentSheet({
        setupIntentClientSecret: clientSecret,
        merchantDisplayName: "ErrandHub",
        allowsDelayedPaymentMethods: false,
      });
      if (initError) {
        Toast.show({ type: "error", text1: initError.message });
        return;
      }

      const { error } = await presentPaymentSheet();
      if (error) {
        if (error.code !== "Canceled") {
          Toast.show({ type: "error", text1: error.message });
        }
        return;
      }

      dispatch(api.util.invalidateTags(["payment methods"]));
      Toast.show({ type: "success", text1: "Card added successfully" });
    } catch (err) {
      displayErrorMessage(err);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.saveButton,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          opacity: isAddingCard ? 0.6 : 1,
        },
      ]}
      onPress={handleAddCard}
      disabled={isAddingCard}
    >
      <Ionicons name="add" size={18} color={colors.text} />
      <Text style={[styles.saveText, { color: colors.text }]}>
        {isAddingCard ? "Opening..." : "Add Payment Method"}
      </Text>
    </TouchableOpacity>
  );
};

export default AddPaymentMethodButton;

const styles = StyleSheet.create({
  saveButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    alignSelf: "stretch",
    gap: 6,
  },
  saveText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
