import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import BackButton from "@/components/ui/back-button";

// swap with real data later
const MOCK_PAYMENT = {
  errandTitle: "Buy Groceries",
  errandType: "Shopping",
  location: "Tesco Metro, Campus",
  itemBudget: 8.0,
  helperPayment: 3.0,
  stripeFee: 0.28,
};

const Payment = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const router = useRouter();

  const { itemBudget, helperPayment, stripeFee } = MOCK_PAYMENT;
  const total = itemBudget + helperPayment + stripeFee;

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
            <Text style={[styles.value, { color: colors.text }]}>
              {MOCK_PAYMENT.errandTitle}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Type
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {MOCK_PAYMENT.errandType}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Location
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {MOCK_PAYMENT.location}
            </Text>
          </View>
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

          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Item Budget
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              £{itemBudget.toFixed(2)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Helper Payment
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              £{helperPayment.toFixed(2)}
            </Text>
          </View>
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
            Payment will be held securely until task is completed
          </Text>
        </View>

        {/* Pay Button */}
        <TouchableOpacity
          style={[styles.payButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/requester/errand-details")}
        >
          <Text style={styles.payButtonText}>
            Pay & Post Errand — £{total.toFixed(2)}
          </Text>
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
  pageTitle: { fontSize: 20, fontWeight: "700" },
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
  },
  label: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: "500" },
  totalLabel: { fontSize: 16, fontWeight: "700" },
  totalValue: { fontSize: 20, fontWeight: "700" },
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
