import Avatar from "@/components/avatar";
import EmptyState from "@/components/empty-state";
import LoadingSpinner from "@/components/ui/loading-spinner";
import BackButton from "@/components/ui/back-button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useGetPostedErrandsQuery } from "@/store/api/errand";
import { formatErrandType } from "@/utils/errand";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ErrandType } from "@errandhub/shared";

type Filter = "ALL" | ErrandType;

const FILTERS: { label: string; value: Filter }[] = [
  { label: "All", value: "ALL" },
  { label: "Pickup & Delivery", value: "PICKUP_DELIVERY" },
  { label: "Shopping", value: "SHOPPING" },
];

const BrowseErrands = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<Filter>("ALL");

  const {
    currentData: data,
    isLoading,
    isError,
  } = useGetPostedErrandsQuery(undefined, { refetchOnMountOrArgChange: true });

  const errands = (data?.errands ?? []).filter((errand: any) => {
    const matchesFilter =
      activeFilter === "ALL" || errand.type === activeFilter;
    return matchesFilter;
  });

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Fixed Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <BackButton />
        <Text style={[styles.pageTitle, { color: colors.text }]}>
          Browse Tasks
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : isError ? (
        <EmptyState fullScreen isError message="Failed to load tasks" />
      ) : (
        <FlatList
          data={errands}
          keyExtractor={(item: any) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.list, { flexGrow: 1 }]}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              {/* Filters */}
              <View style={styles.filters}>
                {FILTERS.map((filter) => (
                  <TouchableOpacity
                    key={filter.value}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor:
                          activeFilter === filter.value
                            ? colors.primary
                            : colors.surface,
                        borderColor:
                          activeFilter === filter.value
                            ? colors.primary
                            : colors.border,
                      },
                    ]}
                    onPress={() => setActiveFilter(filter.value)}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        {
                          color:
                            activeFilter === filter.value
                              ? "#fff"
                              : colors.textSecondary,
                        },
                      ]}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text
                style={[styles.resultsCount, { color: colors.textTertiary }]}
              >
                {errands.length} task{errands.length !== 1 ? "s" : ""} available
              </Text>
            </View>
          }
          renderItem={({ item }: { item: any }) => (
            <TouchableOpacity
              style={[
                styles.taskCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => router.push(`/helper/task-details?id=${item.id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.taskCardHeader}>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: colors.primary + "20" },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: colors.primary }]}>
                    {formatErrandType(item.type)}
                  </Text>
                </View>
                <Text style={[styles.price, { color: colors.primary }]}>
                  £{(item.agreedPrice ?? item.suggestedPrice ?? 0).toFixed(2)}
                </Text>
              </View>

              <Text
                style={[styles.taskTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text
                style={[styles.taskDesc, { color: colors.textSecondary }]}
                numberOfLines={2}
              >
                {item.description}
              </Text>

              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />

              <View style={styles.locationRow}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={colors.textTertiary}
                />
                <Text
                  style={[styles.locationText, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {item.pickupLocation}
                </Text>
              </View>
              <View style={styles.locationRow}>
                <Ionicons
                  name="navigate-outline"
                  size={14}
                  color={colors.textTertiary}
                />
                <Text
                  style={[styles.locationText, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {item.dropoffLocation}
                </Text>
              </View>

              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />

              <View style={styles.taskCardFooter}>
                <View style={styles.requesterRow}>
                  <Avatar
                    firstName={item.requester?.firstName ?? ""}
                    lastName={item.requester?.lastName ?? ""}
                    uri={item.requester?.avatarUrl ?? undefined}
                    size={26}
                  />
                  <Text
                    style={[
                      styles.requesterName,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {item.requester?.firstName} {item.requester?.lastName}
                  </Text>
                </View>
                <Text style={[styles.timeText, { color: colors.textTertiary }]}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>

              {/* Already offered indicator */}
              {item.offers?.length > 0 && (
                <View
                  style={[
                    styles.offerBadge,
                    { backgroundColor: colors.success + "20" },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={14}
                    color={colors.success}
                  />
                  <Text
                    style={[styles.offerBadgeText, { color: colors.success }]}
                  >
                    Offer submitted — £{item.offers[0].amount.toFixed(2)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <EmptyState
              fullScreen
              message={"No tasks available right now"}
              icon="clipboard-outline"
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default BrowseErrands;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  pageTitle: { fontSize: 18, fontWeight: "700" },
  listHeader: { gap: 14, paddingBottom: 8 },
  list: { padding: 16, gap: 14 },
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
  filters: { flexDirection: "row", gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterText: { fontSize: 13, fontWeight: "500" },
  resultsCount: { fontSize: 12 },
  taskCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  taskCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: "500" },
  price: { fontSize: 18, fontWeight: "700" },
  taskTitle: { fontSize: 15, fontWeight: "600" },
  taskDesc: { fontSize: 13, lineHeight: 18 },
  divider: { height: 1 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  locationText: { fontSize: 13, flex: 1 },
  taskCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  requesterRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  requesterName: { fontSize: 13 },
  timeText: { fontSize: 12 },
  offerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 8,
    borderRadius: 8,
  },
  offerBadgeText: { fontSize: 12, fontWeight: "500" },
});
