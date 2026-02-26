import Input from "@/components/ui/input";
import RichTextInput from "@/components/ui/rich-text-area";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  Category,
  PickupForm,
  pickupSchema,
  ShoppingForm,
  shoppingSchema,
  TaskType,
} from "@/types/errand";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
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

  const [activeTab, setActiveTab] = useState<Category>("quick");
  const [taskType, setTaskType] = useState<TaskType>("shopping");

  const shoppingForm = useForm<ShoppingForm>({
    resolver: zodResolver(shoppingSchema),
    defaultValues: { allowSubstitution: false },
  });

  const pickupForm = useForm<PickupForm>({
    resolver: zodResolver(pickupSchema),
  });

  const onSubmit = (data: ShoppingForm | PickupForm) => {
    console.log(data);
    router.push("/requester/payment");
  };

  const tabs: Category[] = ["quick", "standard", "complex"];

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

        {/* Tab Switcher */}
        <View
          style={[
            styles.tabRow,
            { backgroundColor: colors.backgroundSecondary },
          ]}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tab,
                activeTab === tab && { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === tab ? "#fff" : colors.textSecondary },
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.form}>
          {/* Task Type */}
          <View style={{ gap: 8 }}>
            <Text style={[styles.label, { color: colors.text }]}>
              What kind of task?
            </Text>
            <View style={styles.radioGroup}>
              {(["shopping", "pickup"] as TaskType[]).map((type) => (
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
                    {type === "shopping"
                      ? "Shopping (I need items bought)"
                      : "Pickup/Delivery (no purchase)"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Shopping Form */}
          {taskType === "shopping" && (
            <View style={styles.fields}>
              <Controller
                control={shoppingForm.control}
                name="description"
                render={() => (
                  <RichTextInput
                    label="Description"
                    placeholder="e.g. Buy 1L semi-skimmed milk, loaf of bread, 6 eggs"
                    onChange={(text) =>
                      shoppingForm.setValue("description", text)
                    }
                    error={shoppingForm.formState.errors.description?.message}
                  />
                )}
              />

              <Controller
                control={shoppingForm.control}
                name="store"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="Shop/Store"
                    placeholder="e.g. Tesco Metro, Campus"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={shoppingForm.formState.errors.store?.message}
                    leftIcon={
                      <Ionicons
                        name="storefront-outline"
                        size={18}
                        color={colors.textTertiary}
                      />
                    }
                  />
                )}
              />

              <Controller
                control={shoppingForm.control}
                name="deliveryLocation"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="Delivery Location"
                    placeholder="e.g. My dorm: Building 3, Rm 42"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={
                      shoppingForm.formState.errors.deliveryLocation?.message
                    }
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
                <Text style={{ color: colors.textTertiary }}>Map Preview</Text>
              </View>

              <Controller
                control={shoppingForm.control}
                name="itemBudget"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="£ Item Budget (what items cost)"
                    placeholder="£ 0.00"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={shoppingForm.formState.errors.itemBudget?.message}
                  />
                )}
              />
              <Text style={[styles.hint, { color: colors.textTertiary }]}>
                Suggested: £5-£20 for Quick
              </Text>

              <Controller
                control={shoppingForm.control}
                name="helperPayment"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="£ Helper Payment (for their work)"
                    placeholder="£ 0.00"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={shoppingForm.formState.errors.helperPayment?.message}
                  />
                )}
              />
              <Text style={[styles.hint, { color: colors.textTertiary }]}>
                Suggested: £3-£6 for Quick
              </Text>

              {/* Substitution Checkbox */}
              <Pressable
                style={styles.checkRow}
                onPress={() =>
                  shoppingForm.setValue(
                    "allowSubstitution",
                    !shoppingForm.watch("allowSubstitution"),
                  )
                }
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: colors.border,
                      backgroundColor: shoppingForm.watch("allowSubstitution")
                        ? colors.primary
                        : "transparent",
                    },
                  ]}
                >
                  {shoppingForm.watch("allowSubstitution") && (
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  )}
                </View>
                <Text style={[styles.checkText, { color: colors.text }]}>
                  Helper can substitute items if exact match unavailable
                </Text>
              </Pressable>
            </View>
          )}

          {/* Pickup Form */}
          {taskType === "pickup" && (
            <View style={styles.fields}>
              <Controller
                control={pickupForm.control}
                name="description"
                render={({ field: { value, onChange, onBlur } }) => (
                  <RichTextInput
                    label="Description"
                    placeholder="e.g. Pick up my parcel from student reception"
                    onChange={(text) =>
                      shoppingForm.setValue("description", text)
                    }
                    error={shoppingForm.formState.errors.description?.message}
                  />
                )}
              />

              <Controller
                control={pickupForm.control}
                name="pickupLocation"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="Pickup Location"
                    placeholder="e.g. Student Union Reception"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={pickupForm.formState.errors.pickupLocation?.message}
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
                control={pickupForm.control}
                name="dropoffLocation"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="Drop-off Location"
                    placeholder="e.g. Building 3, Room 42"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={pickupForm.formState.errors.dropoffLocation?.message}
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
                <Text style={{ color: colors.textTertiary }}>
                  Map Preview showing route
                </Text>
              </View>

              <Controller
                control={pickupForm.control}
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

              <Controller
                control={pickupForm.control}
                name="helperPayment"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="£ Helper Payment"
                    placeholder="£ 0.00"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={pickupForm.formState.errors.helperPayment?.message}
                  />
                )}
              />
              <Text style={[styles.hint, { color: colors.textTertiary }]}>
                Suggested: £2-£4 for Quick
              </Text>
            </View>
          )}
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={
            taskType === "shopping"
              ? shoppingForm.handleSubmit(onSubmit)
              : pickupForm.handleSubmit(onSubmit)
          }
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
  scroll: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 4, gap: 20 },
  title: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  tabRow: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  tabText: { fontSize: 14, fontWeight: "500" },
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
  },
  hint: { fontSize: 12, marginTop: -8 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: { fontSize: 13, flex: 1 },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  placeholder: { alignItems: "center", paddingVertical: 60 },
});
