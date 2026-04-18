import Avatar from "@/components/avatar";
import EmptyState from "@/components/empty-state";
import LoadingSpinner from "@/components/ui/loading-spinner";
import BackButton from "@/components/ui/back-button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useGetHelpedErrandsQuery } from "@/store/api/user";
import { formatErrandStatus, formatErrandType } from "@/utils/errand";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ErrandStatus } from "@errandhub/shared";

type Filter = "ALL" | "COMPLETED" | "DISPUTED";

const FILTERS: { label: string; value: Filter }[] = [
  { label: "All", value: "ALL" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Disputed", value: "DISPUTED" },
];

const HelperErrandHistory = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const [activeFilter, setActiveFilter] = useState<Filter>("ALL");
  const [selectedErrand, setSelectedErrand] = useState<any | null>(null);

  const {
    currentData: data,
    isLoading,
    isError,
  } = useGetHelpedErrandsQuery(
    activeFilter === "ALL"
      ? { status: ["COMPLETED", "DISPUTED"] }
      : { status: [activeFilter as ErrandStatus] },
    { refetchOnMountOrArgChange: true },
  );

  const errands = data?.errands ?? [];
  const {
    totalEarned = 0,
    totalCompleted = 0,
    totalDisputed = 0,
  } = data?.summary ?? {};

  const getStatusColor = (status: ErrandStatus) =>
    status === "COMPLETED" ? colors.success : colors.error;

  const getStatusIcon = (status: ErrandStatus) => (
    <Ionicons
      name={
        status === "COMPLETED" ? "checkmark-circle-outline" : "warning-outline"
      }
      size={14}
      color={getStatusColor(status)}
    />
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {isLoading ? (
        <LoadingSpinner fullScreen customSize={1.5} />
      ) : isError ? (
        <EmptyState
          fullScreen
          isError
          message="Failed to load errand history"
        />
      ) : (
        <FlatList
          data={errands}
          keyExtractor={(item: any) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContent]}
          ListHeaderComponent={
            <>
              {/* Header */}
              <View
                style={[styles.header, { borderBottomColor: colors.border }]}
              >
                <BackButton />
                <Text style={[styles.pageTitle, { color: colors.text }]}>
                  Errand History
                </Text>
                <View style={{ width: 40 }} />
              </View>

              {/* Summary Cards */}
              <View style={styles.section}>
                <View style={styles.cardsRow}>
                  {[
                    {
                      label: "Total Earned",
                      value: `£${totalEarned.toFixed(2)}`,
                      icon: "trending-up-outline",
                      color: colors.success,
                    },
                    {
                      label: "Completed",
                      value: String(totalCompleted),
                      icon: "checkmark-circle-outline",
                      color: colors.primary,
                    },
                    {
                      label: "Disputed",
                      value: String(totalDisputed),
                      icon: "warning-outline",
                      color: colors.error,
                    },
                  ].map((stat) => (
                    <View
                      key={stat.label}
                      style={[
                        styles.card,
                        {
                          backgroundColor: colors.backgroundSecondary,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={stat.icon as any}
                        size={18}
                        color={stat.color}
                      />
                      <Text style={[styles.cardValue, { color: colors.text }]}>
                        {stat.value}
                      </Text>
                      <Text
                        style={[
                          styles.cardLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {stat.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Filters */}
              <View style={styles.filterSection}>
                <Ionicons
                  name="filter-outline"
                  size={14}
                  color={colors.textSecondary}
                />
                <View style={styles.filterRow}>
                  {FILTERS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor:
                            activeFilter === option.value
                              ? colors.primary
                              : colors.backgroundSecondary,
                          borderColor:
                            activeFilter === option.value
                              ? colors.primary
                              : colors.border,
                        },
                      ]}
                      onPress={() => setActiveFilter(option.value)}
                    >
                      <Text
                        style={[
                          styles.filterText,
                          {
                            color:
                              activeFilter === option.value
                                ? "#fff"
                                : colors.textSecondary,
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Text
                style={[styles.resultsCount, { color: colors.textTertiary }]}
              >
                {errands.length} errand{errands.length !== 1 ? "s" : ""}
              </Text>
            </>
          }
          renderItem={({ item }: { item: any }) => (
            <TouchableOpacity
              style={[
                styles.errandCard,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.75}
              onPress={() => setSelectedErrand(item)}
            >
              <View style={styles.errandCardHeader}>
                <View style={styles.errandCardLeft}>
                  <Avatar
                    firstName={item.requester?.firstName ?? ""}
                    lastName={item.requester?.lastName ?? ""}
                    uri={item.requester?.avatarUrl ?? undefined}
                    size={38}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.errandTitle, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[
                        styles.errandMeta,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {item.requester?.firstName} {item.requester?.lastName} ·{" "}
                      {formatErrandType(item.type)}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.textTertiary}
                />
              </View>

              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />

              <View style={styles.errandCardFooter}>
                <View style={styles.statusRow}>
                  {getStatusIcon(item.status)}
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(item.status) },
                    ]}
                  >
                    {formatErrandStatus(item.status)}
                  </Text>
                </View>
                <Text
                  style={[styles.errandDate, { color: colors.textTertiary }]}
                >
                  {new Date(
                    item.completedAt ?? item.createdAt,
                  ).toLocaleDateString()}
                </Text>
                <Text style={[styles.errandPrice, { color: colors.primary }]}>
                  £{item.finalCost.toFixed(2)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <EmptyState
              containerStyle={{ marginHorizontal: 16, flex: 1 }}
              message="No errands found"
              icon="clipboard-outline"
            />
          }
        />
      )}

      {/* Detail Modal */}
      <Modal
        visible={!!selectedErrand}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedErrand(null)}
      >
        {selectedErrand && (
          <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }]}
          >
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setSelectedErrand(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.pageTitle, { color: colors.text }]}>
                Errand Detail
              </Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              {/* Status Banner */}
              <View
                style={[
                  styles.statusBanner,
                  {
                    backgroundColor:
                      getStatusColor(selectedErrand.status) + "15",
                    borderColor: getStatusColor(selectedErrand.status),
                  },
                ]}
              >
                {getStatusIcon(selectedErrand.status)}
                <Text
                  style={[
                    styles.statusBannerText,
                    { color: getStatusColor(selectedErrand.status) },
                  ]}
                >
                  {formatErrandStatus(selectedErrand.status)}
                </Text>
              </View>

              {/* Detail Rows */}
              <View style={styles.detailSection}>
                <View
                  style={[
                    styles.detailCard,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {[
                    { label: "Task", value: selectedErrand.title },
                    {
                      label: "Type",
                      value: formatErrandType(selectedErrand.type),
                    },
                    { label: "Pickup", value: selectedErrand.firstLocation },
                    { label: "Dropoff", value: selectedErrand.finalLocation },
                    {
                      label: "Requester",
                      value: `${selectedErrand.requester?.firstName} ${selectedErrand.requester?.lastName}`,
                    },
                    {
                      label: "Completed",
                      value: selectedErrand.completedAt
                        ? new Date(selectedErrand.completedAt).toLocaleString(
                            [],
                            {
                              dateStyle: "medium",
                              timeStyle: "short",
                            },
                          )
                        : "N/A",
                    },
                    {
                      label: "Earned",
                      value: `£${selectedErrand.finalCost.toFixed(2)}`,
                    },
                  ].map((row, index, arr) => (
                    <View key={row.label}>
                      <View style={styles.detailRow}>
                        <Text
                          style={[
                            styles.detailLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {row.label}
                        </Text>
                        <Text
                          style={[
                            styles.detailValue,
                            {
                              color:
                                row.label === "Earned"
                                  ? colors.success
                                  : colors.text,
                              fontWeight:
                                row.label === "Earned" ? "700" : "500",
                            },
                          ]}
                        >
                          {row.value}
                        </Text>
                      </View>
                      {index < arr.length - 1 && (
                        <View
                          style={[
                            styles.divider,
                            { backgroundColor: colors.border },
                          ]}
                        />
                      )}
                    </View>
                  ))}
                </View>
              </View>

              {/* Disputed notice */}
              {selectedErrand.status === "DISPUTED" && (
                <View style={styles.detailSection}>
                  <View
                    style={[
                      styles.noticeCard,
                      {
                        backgroundColor: colors.error + "12",
                        borderColor: colors.error + "50",
                      },
                    ]}
                  >
                    <Ionicons
                      name="warning-outline"
                      size={20}
                      color={colors.error}
                    />
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text
                        style={[
                          styles.noticeBody,
                          { color: colors.textSecondary },
                        ]}
                      >
                        The requester has raised a dispute on this errand. Our
                        team is reviewing it and will reach out if needed.
                        Payment is held in escrow until the dispute is resolved.
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
};

export default HelperErrandHistory;

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
  pageTitle: { fontSize: 20, fontWeight: "700" },
  listContent: { flex: 1 },
  section: { paddingHorizontal: 16, paddingTop: 20, gap: 12 },
  cardsRow: { flexDirection: "row", gap: 10 },
  card: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, gap: 6 },
  cardValue: { fontSize: 18, fontWeight: "700" },
  cardLabel: { fontSize: 11 },
  filterSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  filterRow: { flexDirection: "row", gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: { fontSize: 13, fontWeight: "500" },
  resultsCount: {
    fontSize: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  errandCard: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  errandCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errandCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  errandTitle: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  errandMeta: { fontSize: 12 },
  divider: { height: 1 },
  errandCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  statusText: { fontSize: 12, fontWeight: "600" },
  errandDate: { fontSize: 12 },
  errandPrice: { fontSize: 14, fontWeight: "700" },
  modalContent: { paddingBottom: 40 },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusBannerText: { fontSize: 14, fontWeight: "600" },
  detailSection: { paddingHorizontal: 16, paddingTop: 16 },
  detailCard: { borderRadius: 10, borderWidth: 1, overflow: "hidden" },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  detailLabel: { fontSize: 14, flexShrink: 0 },
  detailValue: { fontSize: 14, flex: 1, textAlign: "right" },
  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  noticeTitle: { fontSize: 14, fontWeight: "700" },
  noticeBody: { fontSize: 13, lineHeight: 19 },
});
