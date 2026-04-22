import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  RichEditor,
  RichToolbar,
  actions,
} from "react-native-pell-rich-editor";

type Props = {
  label?: string;
  placeholder?: string;
  onChange: (text: string) => void;
  error?: string;
};

/**
 * Rich text input built on react-native-pell-rich-editor with a minimal
 * toolbar (bold, italic, bullet/ordered list). Emits the edited HTML as a
 * string via onChange. Used for errand descriptions where basic formatting
 * is helpful (numbered steps, emphasis) without needing a full editor.
 */
const RichTextInput = ({ label, placeholder, onChange, error }: Props) => {
  const richText = useRef<RichEditor>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.wrapper,
          { borderColor: error ? colors.error : colors.border },
        ]}
      >
        <RichToolbar
          editor={richText}
          actions={[
            actions.setBold,
            actions.setItalic,
            actions.insertBulletsList,
            actions.insertOrderedList,
          ]}
          style={[
            styles.toolbar,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            },
          ]}
          iconTint={colors.textSecondary}
          selectedIconTint={colors.primary}
        />
        <RichEditor
          ref={richText}
          placeholder={placeholder}
          initialHeight={180}
          onChange={onChange}
          editorStyle={{
            backgroundColor: colors.surface,
            color: colors.text,
            placeholderColor: colors.textTertiary,
          }}
          style={styles.editor}
        />
      </View>
      {error && (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
};

export default RichTextInput;

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 14, fontWeight: "500" },
  wrapper: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  toolbar: {
    borderBottomWidth: 1,
  },
  editor: {
    minHeight: 120,
    backgroundColor: "#000",
  },
  error: { fontSize: 12 },
});
