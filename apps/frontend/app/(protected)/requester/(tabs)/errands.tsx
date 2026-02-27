import ErrandCard from "@/components/errand-card";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Filter = "all" | "active" | "completed" | "cancelled";

const MOCK_ERRANDS = [
  {
    id: "1",
    type: "Standard" as const,
    status: "completed" as const,
    title: "Buy Groceries",
    location: "Whole Foods • Delivered",
    amount: "£35.00",
    time: "Yesterday",
    helperFirstName: "Mike",
    helperLastName: "T",
  },
  {
    id: "2",
    type: "Quick" as const,
    status: "cancelled" as const,
    title: "Pick Up Laundry",
    location: "Campus Laundry",
    amount: "£15.00",
    time: "3 days ago",
  },
  {
    id: "3",
    type: "Quick" as const,
    status: "completed" as const,
    title: "Drop Parcel at Post Office",
    location: "USPS Main St",
    amount: "£12.50",
    time: "4 days ago",
    helperFirstName: "Sarah",
    helperLastName: "K",
  },
  {
    id: "4",
    type: "Complex" as const,
    status: "active" as const,
    title: "Pick Up Prescription",
    location: "Campus Pharmacy",
    amount: "£20.00",
    time: "Just now",
    helperFirstName: "James",
    helperLastName: "L",
  },
];

const filters: Filter[] = ["all", "active", "completed", "cancelled"];

const ErrandHistory = () => {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const colors = Colors[colorScheme ?? "dark"];
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const filtered = MOCK_ERRANDS.filter((errand) => {
    const matchesFilter =
      activeFilter === "all" || errand.status === activeFilter;
    const matchesSearch = errand.title
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Errand History
        </Text>

        {/* Search */}
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={colors.textTertiary}
          />
          <TextInput
            placeholder="Search tasks..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    activeFilter === filter ? colors.primary : colors.surface,
                  borderColor:
                    activeFilter === filter ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color:
                      activeFilter === filter ? "#fff" : colors.textSecondary,
                  },
                ]}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ErrandCard
            type={item.type}
            status={item.status}
            title={item.title}
            location={item.location}
            amount={item.amount}
            time={item.time}
            onPress={() => router.push("/requester/errand-details")}
            helperFirstName={item.helperFirstName}
            helperLastName={item.helperLastName}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="clipboard-outline"
              size={48}
              color={colors.textTertiary}
            />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              No errands found
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default ErrandHistory;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  filters: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
  },
});
