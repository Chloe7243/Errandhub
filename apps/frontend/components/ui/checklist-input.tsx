import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  label?: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  error?: string;
};

const parse = (value: string): string[] => {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return value ? [value] : [];
};

const ChecklistInput = ({
  label,
  value,
  placeholder,
  onChange,
  error,
}: Props) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];

  const [items, setItems] = useState<string[]>(() => parse(value));
  const [newItem, setNewItem] = useState("");
  const inputRef = useRef<TextInput>(null);

  // Sync internal state when value is changed externally (e.g. repost prefill via reset())
  useEffect(() => {
    const parsed = parse(value);
    setItems((current) => {
      // Skip update if content is identical — avoids looping after user edits
      if (JSON.stringify(parsed) === JSON.stringify(current)) return current;
      return parsed;
    });
  }, [value]);

  const commit = (updated: string[]) => {
    setItems(updated);
    onChange(updated.length > 0 ? JSON.stringify(updated) : "");
  };

  const addItem = () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    commit([...items, trimmed]);
    setNewItem("");
    inputRef.current?.focus();
  };

  const removeItem = (index: number) => {
    commit(items.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
      )}

      {/* Existing items */}
      {items.length > 0 && (
        <View
          style={[
            styles.itemsCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {items.map((item, index) => (
            <View
              key={index}
              style={[
                styles.itemRow,
                index < items.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View
                style={[styles.bullet, { backgroundColor: colors.primary }]}
              />
              <Text
                style={[styles.itemText, { color: colors.text }]}
                numberOfLines={2}
              >
                {item}
              </Text>
              <TouchableOpacity
                onPress={() => removeItem(index)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Add new item row */}
      <View
        style={[
          styles.addRow,
          {
            backgroundColor: colors.surface,
            borderColor:
              error && items.length === 0 ? colors.error : colors.border,
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          value={newItem}
          onChangeText={setNewItem}
          placeholder={
            placeholder ??
            (items.length === 0
              ? "Add your first item..."
              : "Add another item...")
          }
          placeholderTextColor={colors.textTertiary}
          style={[styles.addInput, { color: colors.text }]}
          returnKeyType="done"
          onSubmitEditing={addItem}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          onPress={addItem}
          disabled={!newItem.trim()}
          style={[
            styles.addButton,
            {
              backgroundColor: newItem.trim() ? colors.primary : colors.border,
            },
          ]}
        >
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {error && (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
};

export default ChecklistInput;

const styles = StyleSheet.create({
  container: { width: "100%", gap: 6 },
  label: { fontSize: 14, fontWeight: "500" },

  itemsCard: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  bullet: {
    width: 7,
    height: 7,
    borderRadius: 4,
    flexShrink: 0,
  },
  itemText: { flex: 1, fontSize: 14, lineHeight: 20 },

  addRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
  },
  addInput: { flex: 1, fontSize: 15, paddingVertical: 10 },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  error: { fontSize: 12 },
});
