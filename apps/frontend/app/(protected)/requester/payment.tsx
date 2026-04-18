import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import BackButton from "@/components/ui/back-button";
import { useGetErrandByIdQuery, useSetPaymentMethodMutation } from "@/store/api/errand";
import {
  useGetPaymentMethodsQuery,
  type SavedCard,
} from "@/store/api/payment";
import { useState } from "react";
import Toast from "react-native-toast-message";
import { displayErrorMessage } from "@/utils/errors";

const CARD_BRAND_ICONS: Record<string, React.ReactNode> = {
  visa: <FontAwesome6 name="cc-visa" size={24} color="black" />,
  mastercard: <FontAwesome6 name="cc-visa" size={24} color="black" />,
  amex: <FontAwesome6 name="cc-amex" size={24} color="black" />,
  default: <FontAwesome6 name="credit-card" size={24} color="black" />,
};

const stripeFeeFor = (amount: number) =>
  Math.round((amount * 0.015 + 0.2) * 100) / 100;

const Payment = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const router = useRouter();
  const { errandId } = useLocalSearchParams<{ errandId: string }>();

  const { data: errandData, isLoading: errandLoading } = useGetErrandByIdQuery(
    errandId!,
    { skip: !errandId },
  );
  const { data: methodsData, isLoading: cardsLoading } =
    useGetPaymentMethodsQuery();
  const [setPaymentMethod, { isLoading: isSettingMethod }] =
    useSetPaymentMethodMutation();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const errand = errandData?.errand;
  const cards: SavedCard[] = methodsData?.paymentMethods ?? [];

  const helperPayment = errand?.suggestedPrice ?? 5;
  const stripeFee = stripeFeeFor(helperPayment);
  const total = helperPayment + stripeFee;

  const handlePay = async () => {
    if (!selectedCardId) {
      Toast.show({ type: "error", text1: "Please select a payment card" });
      return;
    }
    try {
      await setPaymentMethod({
        errandId: errandId!,
        paymentMethodId: selectedCardId,
      }).unwrap();
      Toast.show({ type: "success", text1: "Errand posted successfully" });
      router.replace(`/requester/errand-details?id=${errandId}`);
    } catch (err) {
      displayErrorMessage(err);
    }
  };

  if (errandLoading || cardsLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator
          style={{ flex: 1 }}
          color={colors.primary}
          size="large"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <Text style={[styles.pageTitle, { color: colors.text }]}>
            Payment
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Errand Summary */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Errand Summary
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Errand
            </Text>
            <Text
              style={[
                styles.value,
                { color: colors.text, flex: 1, textAlign: "right" },
              ]}
              numberOfLines={1}
            >
              {errand?.title ?? "—"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Type
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {errand?.type === "SHOPPING"
                ? "Shopping"
                : errand?.type === "HANDS_ON_HELP"
                ? "Hands-On Help"
                : "Pickup / Delivery"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Pickup
            </Text>
            <Text
              style={[
                styles.value,
                { color: colors.text, flex: 1, textAlign: "right" },
              ]}
              numberOfLines={1}
            >
              {errand?.firstLocation ?? "—"}
            </Text>
          </View>
          {errand?.type !== "HANDS_ON_HELP" && (
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Drop-off
              </Text>
              <Text
                style={[
                  styles.value,
                  { color: colors.text, flex: 1, textAlign: "right" },
                ]}
                numberOfLines={1}
              >
                {errand?.finalLocation ?? "—"}
              </Text>
            </View>
          )}
        </View>

        {/* Payment Breakdown */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Payment Breakdown
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {errand?.type === "HANDS_ON_HELP" ? (
            <>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Hourly Rate
                </Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  £{helperPayment.toFixed(2)}/hr
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Est. Duration
                </Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  {errand.estimatedDuration ?? "?"} hr{(errand.estimatedDuration ?? 0) !== 1 ? "s" : ""}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Est. Total
                </Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  ~£{((errand.estimatedDuration ?? 0) * helperPayment).toFixed(2)}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Helper Payment
              </Text>
              <Text style={[styles.value, { color: colors.text }]}>
                £{helperPayment.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Service Fee
            </Text>
            <Text style={[styles.value, { color: colors.success }]}>£0.00</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Stripe Fee
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              £{stripeFee.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>
              Total
            </Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              £{total.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Card Selection */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Pay With
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {cards.length === 0 ? (
            <View style={styles.noCards}>
              <Ionicons
                name="card-outline"
                size={28}
                color={colors.textTertiary}
              />
              <Text
                style={[styles.noCardsText, { color: colors.textSecondary }]}
              >
                No saved cards yet.
              </Text>
              <TouchableOpacity
                style={[styles.goToProfileBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/requester/profile")}
              >
                <Text style={styles.goToProfileText}>Go to Profile</Text>
              </TouchableOpacity>
            </View>
          ) : (
            cards.map((card) => {
              const selected = selectedCardId === card.id;
              return (
                <TouchableOpacity
                  key={card.id}
                  style={[
                    styles.cardOption,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected
                        ? colors.primary + "12"
                        : "transparent",
                    },
                  ]}
                  onPress={() => setSelectedCardId(card.id)}
                >
                  <Text style={styles.cardIcon}>
                    {CARD_BRAND_ICONS[card.card.brand] ??
                      CARD_BRAND_ICONS.default}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardBrand, { color: colors.text }]}>
                      {card.card.brand.charAt(0).toUpperCase() +
                        card.card.brand.slice(1)}{" "}
                      •••• {card.card.last4}
                    </Text>
                    <Text
                      style={[
                        styles.cardExpiry,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Expires {card.card.exp_month}/{card.card.exp_year}
                    </Text>
                  </View>
                  {selected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Escrow Note */}
        <View
          style={[
            styles.note,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons
            name="lock-closed-outline"
            size={16}
            color={colors.textTertiary}
          />
          <Text style={[styles.noteText, { color: colors.textTertiary }]}>
            {errand?.type === "HANDS_ON_HELP"
              ? "Payment is authorized now and calculated based on actual time worked. Released when you confirm completion."
              : "Payment is held securely and only released once you confirm the errand is complete."}
          </Text>
        </View>

        {/* Pay Button */}
        <TouchableOpacity
          style={[
            styles.payButton,
            {
              backgroundColor:
                cards.length === 0 ? colors.border : colors.primary,
              opacity: isSettingMethod ? 0.7 : 1,
            },
          ]}
          onPress={handlePay}
          disabled={cards.length === 0 || isSettingMethod}
        >
          {isSettingMethod ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>
              {errand?.type === "HANDS_ON_HELP"
                ? "Confirm & Post Errand"
                : `Pay & Post Errand — £${total.toFixed(2)}`}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Payment;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, gap: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: { fontSize: 20, fontWeight: "700", flex: 1, textAlign: "center" },
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600" },
  divider: { height: 1 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  label: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: "500" },
  totalLabel: { fontSize: 16, fontWeight: "700" },
  totalValue: { fontSize: 20, fontWeight: "700" },
  noCards: { alignItems: "center", gap: 12, paddingVertical: 12 },
  noCardsText: { fontSize: 14, textAlign: "center" },
  goToProfileBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  goToProfileText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  cardOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  cardIcon: { fontSize: 22 },
  cardBrand: { fontSize: 14, fontWeight: "600" },
  cardExpiry: { fontSize: 12, marginTop: 2 },
  note: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  noteText: { fontSize: 13, flex: 1 },
  payButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  payButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
