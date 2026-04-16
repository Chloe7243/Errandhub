import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LoadingSpinner from "./loading-spinner";

export type LocationCoords = { lat: number; lng: number };

type AddressFields = {
  line1: string;
  line2: string;
  area: string;
  postcode: string;
};

type SearchResult = {
  label: string;
  coords?: LocationCoords;
  fields?: Partial<AddressFields>;
};

type Props = {
  label?: string;
  placeholder?: string;
  value: string;
  onSelect: (address: string) => void;
  onCoordinatesSelect?: (coords: LocationCoords) => void;
  error?: string;
};

const EMPTY: AddressFields = {
  line1: "",
  line2: "",
  area: "",
  postcode: "",
};

const FIELDS_CONFIG = [
  {
    key: "line1" as const,
    label: "Address Line 1",
    placeholder: "e.g. Flat 99, 169 Netherkirkgate",
    autoCapitalize: "words" as const,
  },
  {
    key: "line2" as const,
    label: "Address Line 2 (optional)",
    placeholder: "e.g. Business Park",
    autoCapitalize: "words" as const,
  },
  {
    key: "area" as const,
    label: "Area (optional)",
    placeholder: "e.g. City Centre",
    autoCapitalize: "words" as const,
  },
  {
    key: "postcode" as const,
    label: "Postcode",
    placeholder: "e.g. CV1 2JH",
    autoCapitalize: "characters" as const,
  },
];

const EASY_POSTCODE_API_KEY =
  process.env.EXPO_PUBLIC_EASY_POSTCODE_API_KEY ?? "";

const toTitleCase = (str: string) =>
  str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const searchAddresses = async (postcode: string): Promise<SearchResult[]> => {
  const url = `https://api.easypostcodes.com/addresses/${encodeURIComponent(postcode)}?includeGeo=true`;
  const res = await fetch(url, {
    headers: { Key: EASY_POSTCODE_API_KEY },
  });
  if (!res.ok) throw new Error("Invalid postcode or no addresses found.");
  const addresses: any[] = (await res.json()) ?? [];
  if (addresses.length === 0)
    throw new Error("No addresses found for that postcode.");

  return addresses.map((a) => {
    const line1 = toTitleCase(a.envelopeAddress?.addressLine1 || "");
    const line2 = toTitleCase(a.envelopeAddress?.addressLine2 || "");
    const area = toTitleCase(a.postTown ?? "");
    const postcode = a.postCode ?? "";
    const lat = parseFloat(a.latitude);
    const lng = parseFloat(a.longitude);

    return {
      label:
        a.envelopeAddress?.summaryLine ??
        [line2, area, postcode].filter(Boolean).join(", "),
      coords: !isNaN(lat) && !isNaN(lng) ? { lat, lng } : undefined,
      fields: {
        line1,
        line2,
        area,
        postcode,
      },
    };
  });
};

const composeAddress = (f: AddressFields) =>
  [f.line1, f.line2, f.area, f.postcode].filter(Boolean).join(", ");

const AddressPicker = ({
  label,
  placeholder,
  value,
  onSelect,
  onCoordinatesSelect,
  error,
}: Props) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [fields, setFields] = useState<AddressFields>(EMPTY);
  const [pendingCoords, setPendingCoords] = useState<
    LocationCoords | undefined
  >();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOpen = () => {
    setQuery("");
    setResults([]);
    setSearchError(null);
    setFields(EMPTY);
    setPendingCoords(undefined);
    setOpen(true);
  };

  const handleSearch = (text: string) => {
    setQuery(text);
    setSearchError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 3) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await searchAddresses(text));
      } catch (err: any) {
        setSearchError(
          err?.message ?? "Could not find addresses for that postcode.",
        );
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 1500);
  };

  const handlePickResult = (result: SearchResult) => {
    setQuery(result.label);
    setResults([]);
    if (result.fields) setFields({ ...EMPTY, ...result.fields });
    if (result.coords) setPendingCoords(result.coords);
  };

  const setField = (key: keyof AddressFields, val: string) =>
    setFields((prev) => ({ ...prev, [key]: val }));

  const handleConfirm = () => {
    const address = composeAddress(fields);
    if (!address) return;
    onSelect(address);
    if (pendingCoords) onCoordinatesSelect?.(pendingCoords);
    setOpen(false);
  };

  const canConfirm = !!(fields.line1 || fields.postcode);
  const preview = composeAddress(fields);

  return (
    <>
      <View style={styles.container}>
        {label && (
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {label}
          </Text>
        )}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleOpen}
          style={[
            styles.trigger,
            {
              backgroundColor: colors.surface,
              borderColor: error ? colors.error : colors.border,
            },
          ]}
        >
          <Ionicons
            name="location-outline"
            size={18}
            color={colors.textTertiary}
            style={styles.iconLeft}
          />
          <Text
            style={[
              styles.triggerText,
              { color: value ? colors.text : colors.textTertiary },
            ]}
            numberOfLines={1}
          >
            {value || placeholder || "Select address..."}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
        {error && (
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        )}
      </View>

      {/* ── Modal ── */}
      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaView
          style={[styles.modalRoot, { backgroundColor: colors.background }]}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            {/* Header */}
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {label ?? "Select Address"}
              </Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.modalBody}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Search bar */}
              <View
                style={[
                  styles.searchBar,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="search-outline"
                  size={18}
                  color={colors.textTertiary}
                />
                <TextInput
                  value={query}
                  onChangeText={handleSearch}
                  placeholder="Enter postcode e.g. CV1 2JH"
                  placeholderTextColor={colors.textTertiary}
                  style={[styles.searchInput, { color: colors.text }]}
                  autoFocus
                  autoCorrect={false}
                />
                {searching ? (
                  <LoadingSpinner size="small" color={colors.primary} />
                ) : query.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => {
                      setQuery("");
                      setResults([]);
                      setSearchError(null);
                    }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={colors.textTertiary}
                    />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Search error */}
              {searchError && (
                <Text style={[styles.searchError, { color: colors.error }]}>
                  {searchError}
                </Text>
              )}

              {/* Search results */}
              {results.length > 0 && (
                <View
                  style={[
                    styles.results,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {results.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.resultItem,
                        index < results.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: colors.border,
                        },
                      ]}
                      onPress={() => handlePickResult(item)}
                    >
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color={colors.primary}
                        style={{ marginTop: 2 }}
                      />
                      <Text
                        style={[styles.resultText, { color: colors.text }]}
                        numberOfLines={2}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View
                  style={[
                    styles.dividerLine,
                    { backgroundColor: colors.border },
                  ]}
                />
                <Text
                  style={[styles.dividerLabel, { color: colors.textTertiary }]}
                >
                  address details
                </Text>
                <View
                  style={[
                    styles.dividerLine,
                    { backgroundColor: colors.border },
                  ]}
                />
              </View>

              {FIELDS_CONFIG.map((f) => (
                <View key={f.key} style={styles.fieldGroup}>
                  <Text
                    style={[styles.fieldLabel, { color: colors.textSecondary }]}
                  >
                    {f.label}
                  </Text>
                  <View
                    style={[
                      styles.fieldInput,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <TextInput
                      value={fields[f.key]}
                      onChangeText={(text) => setField(f.key, text)}
                      placeholder={f.placeholder}
                      placeholderTextColor={colors.textTertiary}
                      style={[styles.fieldTextInput, { color: colors.text }]}
                      autoCorrect={false}
                      autoCapitalize={f.autoCapitalize}
                    />
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Footer */}
            <View
              style={[
                styles.footer,
                {
                  borderTopColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
            >
              {canConfirm && preview ? (
                <Text
                  style={[styles.preview, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {preview}
                </Text>
              ) : null}
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity: canConfirm ? 1 : 0.4,
                  },
                ]}
                onPress={handleConfirm}
                disabled={!canConfirm}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color="#fff"
                />
                <Text style={styles.confirmBtnText}>Use This Address</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
};

export default AddressPicker;

const styles = StyleSheet.create({
  // Trigger
  container: { width: "100%", gap: 6 },
  label: { fontSize: 14, fontWeight: "500" },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  iconLeft: { marginRight: 8 },
  triggerText: { flex: 1, fontSize: 15 },
  error: { fontSize: 12 },

  // Modal shell
  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 17, fontWeight: "700" },
  modalBody: { padding: 20, gap: 14 },

  // Search
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  searchInput: { flex: 1, fontSize: 15 },
  searchError: { fontSize: 12, marginTop: -6 },

  // Results
  results: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: -6,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  resultText: { fontSize: 14, flex: 1, lineHeight: 20 },

  // Divider
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerLabel: { fontSize: 12, fontWeight: "500" },

  // Manual fields
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "500" },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  fieldTextInput: { paddingVertical: 14, fontSize: 15 },

  // Footer
  footer: {
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    gap: 10,
  },
  preview: { fontSize: 13, textAlign: "center" },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  confirmBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
