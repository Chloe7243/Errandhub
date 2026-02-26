import BackButton from "@/components/ui/back-button";
import Input from "@/components/ui/input";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

const REASONS = [
  "Item not delivered",
  "Wrong item delivered",
  "Item damaged",
  "Helper didn't show up",
  "Other",
];

const disputeSchema = z.object({
  reason: z.string().min(1, "Please select a reason"),
  explanation: z.string().min(10, "Please provide more detail"),
});

type DisputeForm = z.infer<typeof disputeSchema>;

const RaiseDispute = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const [reasonOpen, setReasonOpen] = useState(false);
  const [images] = useState<string[]>([]);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DisputeForm>({
    resolver: zodResolver(disputeSchema),
  });

  const selectedReason = watch("reason");

  const onSubmit = (data: DisputeForm) => {
    console.log(data, images);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <BackButton />
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.pageTitle, { color: colors.text }]}>
              Raise Dispute
            </Text>
          </View>

          {/* Escrow Notice */}
          <View
            style={[
              styles.notice,
              {
                borderColor: colors.warning,
                backgroundColor: colors.warning + "15",
              },
            ]}
          >
            <Ionicons name="warning-outline" size={18} color={colors.warning} />
            <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
              Payment is held in escrow while we review your dispute. Most cases
              are resolved within{" "}
              <Text style={{ fontWeight: "700", color: colors.text }}>
                24 hours
              </Text>
              .
            </Text>
          </View>

          {/* Reason Selector */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Select Reason
            </Text>
            <TouchableOpacity
              style={[
                styles.selector,
                {
                  backgroundColor: colors.surface,
                  borderColor: errors.reason ? colors.error : colors.border,
                },
              ]}
              onPress={() => setReasonOpen(!reasonOpen)}
            >
              <Text
                style={[
                  styles.selectorText,
                  { color: selectedReason ? colors.text : colors.textTertiary },
                ]}
              >
                {selectedReason ?? "Select a reason..."}
              </Text>
              <Ionicons
                name={reasonOpen ? "chevron-up" : "chevron-down"}
                size={18}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
            {errors.reason && (
              <Text style={[styles.error, { color: colors.error }]}>
                {errors.reason.message}
              </Text>
            )}

            {reasonOpen && (
              <View
                style={[
                  styles.dropdown,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                {REASONS.map((reason) => (
                  <TouchableOpacity
                    key={reason}
                    style={[
                      styles.dropdownItem,
                      { borderBottomColor: colors.border },
                      selectedReason === reason && {
                        backgroundColor: colors.primary + "20",
                      },
                    ]}
                    onPress={() => {
                      setValue("reason", reason);
                      setReasonOpen(false);
                    }}
                  >
                    <Text style={[styles.dropdownText, { color: colors.text }]}>
                      {reason}
                    </Text>
                    {selectedReason === reason && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Explanation */}
          <Controller
            control={control}
            name="explanation"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Explain the issue"
                placeholder="Please describe what went wrong in detail..."
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.explanation?.message}
                multiline
                inputStyle={{ minHeight: 120, textAlignVertical: "top" }}
              />
            )}
          />

          {/* Upload Evidence */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Upload Evidence
            </Text>
            <TouchableOpacity
              style={[
                styles.uploadBox,
                {
                  borderColor: colors.primary,
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <Ionicons
                name="camera-outline"
                size={32}
                color={colors.primary}
              />
              <Text style={[styles.uploadTitle, { color: colors.text }]}>
                Tap to upload photos
              </Text>
              <Text
                style={[styles.uploadSubtitle, { color: colors.textTertiary }]}
              >
                JPG, PNG up to 5MB • {3 - images.length} remaining
              </Text>
            </TouchableOpacity>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.error }]}
            onPress={handleSubmit(onSubmit)}
          >
            <Ionicons name="warning-outline" size={18} color="#fff" />
            <Text style={styles.submitText}>Submit Dispute</Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Ionicons
              name="information-circle-outline"
              size={14}
              color={colors.textTertiary}
            />
            <Text style={[styles.footerText, { color: colors.textTertiary }]}>
              By submitting, you agree to our{" "}
              <Text style={{ color: colors.primary }}>
                Dispute Resolution Policy
              </Text>
              . Our team will review your case within 24 hours.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RaiseDispute;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, gap: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: { fontSize: 20, fontWeight: "700" },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  noticeText: { fontSize: 13, flex: 1, lineHeight: 18 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: "500" },
  selector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectorText: { fontSize: 15 },
  dropdown: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 4,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
  },
  dropdownText: { fontSize: 14 },
  error: { fontSize: 12 },
  uploadBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    gap: 8,
  },
  uploadTitle: { fontSize: 15, fontWeight: "600" },
  uploadSubtitle: { fontSize: 12 },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  footer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  footerText: { fontSize: 12, flex: 1, lineHeight: 18 },
});
