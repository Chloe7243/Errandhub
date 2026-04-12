import Input from "@/components/ui/input";
import RichTextInput from "@/components/ui/rich-text-area";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  CreateErrandInput,
  createErrandSchema,
  ErrandType,
} from "@errandhub/shared";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCreateErrandMutation } from "@/store/api/errand";
import { displayErrorMessage } from "@/utils/errors";
import Toast from "react-native-toast-message";
import LoadingSpinner from "@/components/ui/loading-spinner";

const CreateErrand = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const [taskType, setTaskType] = useState<ErrandType>("PICKUP_DELIVERY");
  const [createErrand, { isLoading }] = useCreateErrandMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateErrandInput>({
    resolver: zodResolver(createErrandSchema),
    defaultValues: { type: "PICKUP_DELIVERY" },
  });

  useEffect(() => {
    console.log("form errors", errors);
  }, [errors]);

  const onSubmit = async (data: CreateErrandInput) => {
    console.log({ ...data, type: taskType });
    try {
      const result = await createErrand({ ...data, type: taskType }).unwrap();
      console.log("Errand created successfully:", result);
      Toast.show({ type: "success", text1: "Errand posted successfully" });
      router.push(`/requester/errand-details?id=${result.errand.id}`);
    } catch (err) {
      console.error("Error creating errand:", err);
      displayErrorMessage(err);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={[styles.title, { color: colors.text }]}>New Errand</Text>

        <View style={styles.form}>
          {/* Task Type */}
          <View style={{ gap: 8 }}>
            <Text style={[styles.label, { color: colors.text }]}>
              What kind of task?
            </Text>
            <View style={styles.radioGroup}>
              {(["SHOPPING", "PICKUP_DELIVERY"] as ErrandType[]).map((type) => (
                <Pressable
                  key={type}
                  style={styles.radioRow}
                  onPress={() => setTaskType(type)}
                >
                  <View style={[styles.radio, { borderColor: colors.primary }]}>
                    {taskType === type && (
                      <View
                        style={[
                          styles.radioDot,
                          { backgroundColor: colors.primary },
                        ]}
                      />
                    )}
                  </View>
                  <Text style={[styles.radioText, { color: colors.text }]}>
                    {type === "SHOPPING"
                      ? "Shopping (I need items bought)"
                      : "Pickup / Delivery (no purchase)"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Shared Fields */}
          <View style={styles.fields}>
            <Controller
              control={control}
              name="title"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Title"
                  placeholder="e.g. Pick up my parcel"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.title?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field: { onChange } }) => (
                <RichTextInput
                  label="Description"
                  placeholder="Describe your errand in detail..."
                  onChange={onChange}
                  error={errors.description?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="pickupLocation"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Pickup Location"
                  placeholder="e.g. Student Union Reception"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.pickupLocation?.message}
                  leftIcon={
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={colors.textTertiary}
                    />
                  }
                />
              )}
            />

            <Controller
              control={control}
              name="dropoffLocation"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Drop-off Location"
                  placeholder="e.g. Building 3, Room 42"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.dropoffLocation?.message}
                  leftIcon={
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={colors.textTertiary}
                    />
                  }
                />
              )}
            />

            {/* Map Placeholder */}
            <View
              style={[
                styles.mapPlaceholder,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="map-outline"
                size={24}
                color={colors.textTertiary}
              />
              <Text style={{ color: colors.textTertiary }}>Map Preview</Text>
            </View>

            <Controller
              control={control}
              name="pickupReference"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Pickup Reference (optional)"
                  placeholder="e.g. Name: Alice Smith, Code: #PKG-8472"
                  value={value ?? ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          </View>

          {/* Suggested Price Notice */}
          <View
            style={[
              styles.notice,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
              A suggested price will be calculated based on distance. Helpers
              can adjust their bid before you confirm.
            </Text>
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary, opacity: isLoading ? 0.7 : 1 },
          ]}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading ? (
            <LoadingSpinner size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Post Errand</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateErrand;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24, gap: 20 },
  title: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  form: { gap: 22 },
  fields: { gap: 16 },
  label: { fontSize: 16, fontWeight: "500" },
  radioGroup: { gap: 10 },
  radioRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  radioText: { fontSize: 14, flex: 1 },
  mapPlaceholder: {
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  noticeText: { fontSize: 13, flex: 1, lineHeight: 18 },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
