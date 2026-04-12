import ErrandCard from "@/components/errand-card";
import EmptyState from "@/components/empty-state";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useGetRequestedErrandsQuery } from "@/store/api/user";
import { ErrandStatus } from "@errandhub/shared";
import { formatErrandStatus } from "@/utils/errand";
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
import LoadingSpinner from "@/components/ui/loading-spinner";

type Filter = "ALL" | ErrandStatus;

const filters: Filter[] = [
  "ALL",
  "ACCEPTED",
  "IN_PROGRESS",
  "REVIEWING",
  "COMPLETED",
  "CANCELLED",
  "DISPUTED",
  "EXPIRED",
];

const ErrandHistory = () => {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const colors = Colors[colorScheme ?? "dark"];
  const [activeFilter, setActiveFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");

  const {
    currentData: data,
    isLoading,
    isError,
  } = useGetRequestedErrandsQuery(
    activeFilter === "ALL"
      ? { status: ["ACCEPTED", "IN_PROGRESS", "REVIEWING", "COMPLETED", "CANCELLED", "DISPUTED", "EXPIRED"] }
      : { status: [activeFilter] },
    { refetchOnMountOrArgChange: true },
  );

  const filtered = data?.errands.filter((errand: any) =>
    errand.title.toLowerCase().includes(search.toLowerCase()),
  );

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
            placeholder="Search errands..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        <FlatList
          data={filters}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setActiveFilter(item)}
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    activeFilter === item ? colors.primary : colors.surface,
                  borderColor:
                    activeFilter === item ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color:
                      activeFilter === item ? "#fff" : colors.textSecondary,
                  },
                ]}
              >
                {item === "ALL" ? "All" : formatErrandStatus(item)}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* List */}
      {isLoading ? (
        <LoadingSpinner fullScreen customSize={1.5} color="#fff" />
      ) : isError ? (
        <EmptyState fullScreen isError message="Failed to load errands" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={[styles.list]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: { item: any }) => (
            <ErrandCard
              type={item.type}
              status={item.status}
              title={item.title}
              location={item.pickupLocation}
              amount={item.agreedPrice ?? item.suggestedPrice}
              time={new Date(item.createdAt).toLocaleDateString()}
              onPress={() =>
                router.push(`/requester/errand-details?id=${item.id}`)
              }
              helperFirstName={item.helper?.firstName}
              helperLastName={item.helper?.lastName}
              helperAvatar={item.helper?.avatarUrl}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              containerStyle={{ flex: 1 }}
              fullScreen
              message="No errands found"
              icon="clipboard-outline"
            />
          }
        />
      )}
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
  title: { fontSize: 20, fontWeight: "700" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterText: { fontSize: 13, fontWeight: "500" },
  list: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
});
