import AddressPicker, {
  type LocationCoords,
} from "@/components/ui/address-picker";
import ChecklistInput from "@/components/ui/checklist-input";
import Input from "@/components/ui/input";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  createErrandSchema,
  ErrandType,
  type CreateErrandInput,
} from "@errandhub/shared";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
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

const CreateErrand = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const prefill = useLocalSearchParams() as Partial<CreateErrandInput>;
  const [taskType, setTaskType] = useState<ErrandType | null>(
    prefill.type ?? null,
  );
  const [pickupCoords, setPickupCoords] = useState<LocationCoords | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<LocationCoords | null>(
    null,
  );

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateErrandInput>({
    resolver: zodResolver(createErrandSchema),
  });

  // Pre-fill the form when arriving from a repost.
  // When there is no prefill type the field is left undefined so the user
  // must make an explicit selection — Zod will reject the form otherwise.
  useEffect(() => {
    const type = prefill.type ?? null;
    setTaskType(type);
    reset({
      title: prefill.title ?? "",
      description: prefill.description ?? "",
      firstLocation: prefill.firstLocation ?? "",
      finalLocation: prefill.finalLocation ?? "",
      locationReference: prefill.locationReference ?? "",
      // Only include type when repasting — keeps the field undefined for a
      // fresh form so Zod's required check fires if the user skips it.
      ...(type ? { type } : {}),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (data: CreateErrandInput) => {
    // data.type comes from setValue() so it is always the user's actual
    // selection — no need to override with the local taskType mirror.
    const isHandsOn = data.type === "HANDS_ON_HELP";
    const pendingErrand = {
      ...data,
      finalLocation: isHandsOn ? data.firstLocation : data.finalLocation,
      firstLat: pickupCoords?.lat,
      firstLng: pickupCoords?.lng,
      finalLat: isHandsOn ? pickupCoords?.lat : dropoffCoords?.lat,
      finalLng: isHandsOn ? pickupCoords?.lng : dropoffCoords?.lng,
    };
    router.push({
      pathname: "/requester/payment",
      params: { errandData: JSON.stringify(pendingErrand) },
    });
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
              {(
                ["PICKUP_DELIVERY", "SHOPPING", "HANDS_ON_HELP"] as ErrandType[]
              ).map((type) => (
                <Pressable
                  key={type}
                  style={styles.radioRow}
                  onPress={() => {
                    setTaskType(type);
                    // Sync the selection into RHF so Zod sees the value.
                    setValue("type", type, { shouldValidate: true });
                  }}
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
                      : type === "HANDS_ON_HELP"
                        ? "Hands-On Help (e.g. moving stuff, setting up, cleaning)"
                        : "Pickup / Delivery (no purchase)"}
                  </Text>
                </Pressable>
              ))}
            </View>
            {errors.type && (
              <Text style={{ color: "red", fontSize: 12 }}>
                {errors.type.message ?? "Please select a task type"}
              </Text>
            )}
          </View>

          {/* Shared Fields */}
          <View style={styles.fields}>
            <Controller
              control={control}
              name="title"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Title"
                  placeholder={
                    taskType === "HANDS_ON_HELP"
                      ? "e.g. Move my furniture"
                      : "e.g. Pick up my parcel"
                  }
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
              render={({ field: { value, onChange } }) => (
                <ChecklistInput
                  label="Instructions"
                  placeholder="Enter Instruction and press enter"
                  value={value ?? ""}
                  onChange={onChange}
                  error={errors.description?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="firstLocation"
              render={({ field: { value, onChange } }) => (
                <AddressPicker
                  label={
                    taskType === "HANDS_ON_HELP"
                      ? "Location"
                      : "Pickup Location"
                  }
                  placeholder={
                    taskType === "HANDS_ON_HELP"
                      ? "Search location..."
                      : "Search pickup address..."
                  }
                  value={value}
                  onSelect={onChange}
                  onCoordinatesSelect={setPickupCoords}
                  error={errors.firstLocation?.message}
                />
              )}
            />

            {(taskType === "PICKUP_DELIVERY" || taskType === "SHOPPING") && (
              <>
                <Controller
                  control={control}
                  name="finalLocation"
                  render={({ field: { value, onChange } }) => (
                    <AddressPicker
                      label="Drop-off Location"
                      placeholder="Search drop-off address..."
                      value={value ?? ""}
                      onSelect={onChange}
                      onCoordinatesSelect={setDropoffCoords}
                      error={errors.finalLocation?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="locationReference"
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
              </>
            )}

            {taskType === "HANDS_ON_HELP" && (
              <Controller
                control={control}
                name="estimatedDuration"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="Estimated Duration (hours)"
                    placeholder="e.g. 2"
                    value={value ? String(value) : ""}
                    onChangeText={(t) =>
                      onChange(t ? parseFloat(t) : undefined)
                    }
                    onBlur={onBlur}
                    keyboardType="decimal-pad"
                    error={errors.estimatedDuration?.message}
                  />
                )}
              />
            )}
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
              {taskType === "HANDS_ON_HELP"
                ? "A suggested hourly rate will be shown. Helpers can negotiate the rate before you confirm."
                : taskType === null
                  ? "Select a task type above to see pricing info."
                  : "A suggested price will be calculated based on distance. Helpers can make a counter-offer before you confirm."}
            </Text>
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleSubmit(onSubmit)}
        >
          <Text style={styles.buttonText}>Continue to Payment</Text>
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
