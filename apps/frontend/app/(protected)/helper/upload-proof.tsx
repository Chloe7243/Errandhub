// app/helper/upload-proof.tsx
import BackButton from "@/components/ui/back-button";
import { Colors } from "@/constants/theme";
import { Camera, CheckCircle, FileImage, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type UploadProofProps = {
  taskId: string;
  taskTitle: string;
  onBack: () => void;
  onSubmit: (proof: { imageUri: string; note: string }) => void;
};

const UploadProof = ({
  taskId,
  taskTitle,
  onBack,
  onSubmit,
}: UploadProofProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [note, setNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handlePickImage = (): void => {
    // hook up to expo-image-picker here
    console.log("Pick image for task", taskId);
  };

  const handleRemoveImage = (): void => {
    setImageUri(null);
  };

  const handleSubmit = async (): Promise<void> => {
    if (!imageUri) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ imageUri, note });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = !!imageUri && !isSubmitting;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <BackButton noText />
        <Text style={[styles.pageTitle, { color: colors.text }]}>
          Upload Proof
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Task Reference */}
        <View
          style={[
            styles.taskRef,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            },
          ]}
        >
          <FileImage size={16} color={colors.textSecondary} />
          <Text style={[styles.taskRefText, { color: colors.textSecondary }]}>
            Proof for:{" "}
            <Text style={[styles.taskRefTitle, { color: colors.text }]}>
              {taskTitle ?? "Pick up dry cleaning"}
            </Text>
          </Text>
        </View>

        {/* Image Upload Area */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Photo Evidence
          </Text>
          <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
            Take or upload a photo showing the completed task
          </Text>

          {imageUri ? (
            <View style={styles.imagePreviewWrapper}>
              <Image
                source={{ uri: imageUri }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={[
                  styles.removeImageBtn,
                  { backgroundColor: colors.error },
                ]}
                onPress={handleRemoveImage}
                activeOpacity={0.8}
              >
                <X size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.uploadArea,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.7}
              onPress={handlePickImage}
            >
              <View
                style={[
                  styles.uploadIconWrapper,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Camera size={28} color={colors.primary} />
              </View>
              <Text style={[styles.uploadTitle, { color: colors.text }]}>
                Add photo proof
              </Text>
              <Text style={[styles.uploadSub, { color: colors.textTertiary }]}>
                Tap to take a photo or choose from gallery
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Note */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Note{" "}
            <Text style={[styles.optional, { color: colors.textTertiary }]}>
              (optional)
            </Text>
          </Text>
          <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
            Add any additional context for the requester
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="e.g. Left the package at the front door as requested..."
            placeholderTextColor={colors.textTertiary}
            style={[
              styles.noteInput,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Submit */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.submitBtn,
              {
                backgroundColor: canSubmit ? colors.primary : colors.border,
              },
            ]}
            activeOpacity={0.8}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <CheckCircle size={18} color="#fff" />
                <Text style={styles.submitBtnText}>
                  Submit Proof and Complete
                </Text>
              </>
            )}
          </TouchableOpacity>

          {!imageUri && (
            <Text style={[styles.submitHint, { color: colors.textTertiary }]}>
              You must add a photo before submitting
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UploadProof;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  content: {
    paddingBottom: 40,
  },
  taskRef: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  taskRefText: {
    fontSize: 13,
  },
  taskRefTitle: {
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  sectionSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  optional: {
    fontWeight: "400",
    fontSize: 13,
  },
  uploadArea: {
    marginTop: 4,
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  uploadIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  uploadSub: {
    fontSize: 12,
  },
  imagePreviewWrapper: {
    marginTop: 4,
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: 220,
    borderRadius: 12,
  },
  removeImageBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
    marginTop: 20,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    marginTop: 4,
  },
  actions: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 10,
    alignItems: "center",
  },
  submitBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  submitHint: {
    fontSize: 12,
  },
});
