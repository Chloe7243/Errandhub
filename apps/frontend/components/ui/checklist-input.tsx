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

/**
 * Parse the description field into a checklist item array.
 *
 * The description is a single string server-side; newer errands encode a
 * multi-item checklist as JSON while older/freeform entries are plain text.
 * This helper handles both so editing a legacy errand still renders its
 * text as a single-item list instead of showing an empty checklist.
 */
const parse = (value: string): string[] => {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return value ? [value] : [];
};

/**
 * Dynamic list input used on the create-errand form for shopping/pickup
 * checklists. Renders existing items with inline-edit and delete, plus an
 * "add row" input. Emits a JSON-encoded string array (or the empty string
 * when cleared) to the parent via onChange so it slots straight into the
 * form's `description` field. Tapping an item opens an inline editor;
 * committing an empty edit removes the item. Props:
 *   - label / placeholder / error: standard form chrome.
 *   - value: incoming JSON string (or plain text for legacy errands).
 *   - onChange: called with the serialised value on every mutation.
 */
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const inputRef = useRef<TextInput>(null);
  const editInputRef = useRef<TextInput>(null);

  // Sync internal items when the parent resets/prefills the value prop (e.g. repost flow).
  // The identity check prevents a loop: onChange serialises items → parent updates value prop
  // → this effect fires → setItems would re-render → onChange fires again …
  useEffect(() => {
    const parsed = parse(value);
    setItems((current) => {
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

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditingValue(items[index]);
    // Defer focus by one frame — the edit TextInput is not yet mounted when state is set.
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  // Committing an empty edit removes the item — this way the user can delete by
  // clearing the inline field rather than needing to hit the separate remove button.
  const commitEdit = () => {
    if (editingIndex === null) return;
    const trimmed = editingValue.trim();
    if (trimmed) {
      const updated = items.map((item, i) => (i === editingIndex ? trimmed : item));
      commit(updated);
    } else {
      commit(items.filter((_, i) => i !== editingIndex));
    }
    setEditingIndex(null);
    setEditingValue("");
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
              {editingIndex === index ? (
                <TextInput
                  ref={editInputRef}
                  value={editingValue}
                  onChangeText={setEditingValue}
                  onBlur={commitEdit}
                  onSubmitEditing={commitEdit}
                  returnKeyType="done"
                  blurOnSubmit
                  style={[styles.itemText, styles.itemEditInput, { color: colors.text }]}
                />
              ) : (
                <TouchableOpacity style={styles.itemTextWrapper} onPress={() => startEditing(index)}>
                  <Text style={[styles.itemText, { color: colors.text }]} numberOfLines={2}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
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
  itemTextWrapper: { flex: 1 },
  itemEditInput: { padding: 0 },

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
