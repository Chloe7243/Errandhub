import BackButton from "@/components/ui/back-button";
import Input from "@/components/ui/input";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRaiseDisputeMutation } from "@/store/api/errand";
import { displayErrorMessage } from "@/utils/errors";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { z } from "zod";

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

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

const uploadImage = async (localUri: string): Promise<string> => {
  const formData = new FormData();
  formData.append("file", { uri: localUri, type: "image/jpeg", name: "evidence.jpg" } as any);
  formData.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData },
  );
  const data = await res.json();
  return data.secure_url as string;
};

const RaiseDispute = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [raiseDispute, { isLoading: isSubmitting }] = useRaiseDisputeMutation();

  const [reasonOpen, setReasonOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

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

  const pickImage = async (): Promise<void> => {
    if (images.length >= 3 || uploading) return;

    Alert.alert("Add Evidence Photo", "Choose how to add your photo", [
      {
        text: "Camera",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            Toast.show({ type: "error", text1: "Camera permission required" });
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: "images",
            allowsEditing: true,
            quality: 0.8,
          });
          if (result.canceled) return;
          setUploading(true);
          try {
            const url = await uploadImage(result.assets[0].uri);
            setImages((prev) => [...prev, url]);
          } catch {
            Toast.show({
              type: "error",
              text1: "Upload failed",
              text2: "Could not upload image. Please try again.",
            });
          } finally {
            setUploading(false);
          }
        },
      },
      {
        text: "Photo Library",
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            Toast.show({ type: "error", text1: "Photo library permission required" });
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: "images",
            allowsEditing: true,
            quality: 0.8,
          });
          if (result.canceled) return;
          setUploading(true);
          try {
            const url = await uploadImage(result.assets[0].uri);
            setImages((prev) => [...prev, url]);
          } catch {
            Toast.show({
              type: "error",
              text1: "Upload failed",
              text2: "Could not upload image. Please try again.",
            });
          } finally {
            setUploading(false);
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const removeImage = (index: number): void => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: DisputeForm): Promise<void> => {
    try {
      await raiseDispute({
        errandId: id!,
        reason: data.reason,
        explanation: data.explanation,
        evidenceImageUrl: images[0],
      }).unwrap();

      Toast.show({
        type: "success",
        text1: "Dispute submitted",
        text2: "We will review your dispute shortly.",
      });

      router.replace("/requester/home");
    } catch (err) {
      displayErrorMessage(err);
    }
  };

  const canSubmit = !isSubmitting && !uploading;

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
              Payment is held in escrow while we review your dispute.
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
                  borderColor: images.length >= 3 ? colors.border : colors.primary,
                  backgroundColor: colors.surface,
                  opacity: images.length >= 3 ? 0.5 : 1,
                },
              ]}
              onPress={pickImage}
              disabled={images.length >= 3 || uploading}
            >
              {uploading ? (
                <>
                  <LoadingSpinner size="large" />
                  <Text style={[styles.uploadSubtitle, { color: colors.textTertiary }]}>
                    Uploading...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="camera-outline"
                    size={32}
                    color={images.length >= 3 ? colors.textTertiary : colors.primary}
                  />
                  <Text style={[styles.uploadTitle, { color: colors.text }]}>
                    Tap to upload photos
                  </Text>
                  <Text
                    style={[styles.uploadSubtitle, { color: colors.textTertiary }]}
                  >
                    JPG, PNG up to 5MB • {3 - images.length} remaining
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Thumbnail previews */}
            {images.length > 0 && (
              <View style={styles.thumbnailRow}>
                {images.map((uri, index) => (
                  <View key={uri} style={styles.thumbnailWrapper}>
                    <Image
                      source={{ uri }}
                      style={styles.thumbnail}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={[
                        styles.removeThumbnailBtn,
                        { backgroundColor: colors.error },
                      ]}
                      onPress={() => removeImage(index)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: canSubmit ? colors.error : colors.border },
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={!canSubmit}
          >
            {isSubmitting ? (
              <LoadingSpinner color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="warning-outline" size={18} color="#fff" />
                <Text style={styles.submitText}>Submit Dispute</Text>
              </>
            )}
          </TouchableOpacity>
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
  thumbnailRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    flexWrap: "wrap",
  },
  thumbnailWrapper: {
    position: "relative",
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  removeThumbnailBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
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
