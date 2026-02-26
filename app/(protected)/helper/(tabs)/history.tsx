// app/helper/errand-history.tsx
import Avatar from "@/components/avatar";
import BackButton from "@/components/ui/back-button";
import { Colors } from "@/constants/theme";
import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  TrendingUp,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ErrandStatus = "completed" | "disputed";

type Errand = {
  id: string;
  title: string;
  price: string;
  date: string;
  requester: { firstName: string; lastName: string };
  status: ErrandStatus;
  distance: string;
};

type FilterOption = "all" | ErrandStatus;

const MOCK_ERRANDS: Errand[] = [
  {
    id: "1",
    title: "Pick up dry cleaning",
    price: "$5.00",
    date: "26 Feb 2026",
    requester: { firstName: "Sarah", lastName: "L" },
    status: "completed",
    distance: "2.5km",
  },
  {
    id: "2",
    title: "Grocery run",
    price: "$12.00",
    date: "25 Feb 2026",
    requester: { firstName: "James", lastName: "K" },
    status: "completed",
    distance: "1.2km",
  },
  {
    id: "3",
    title: "Drop off parcel",
    price: "$8.00",
    date: "24 Feb 2026",
    requester: { firstName: "Priya", lastName: "M" },
    status: "disputed",
    distance: "3.1km",
  },
  {
    id: "4",
    title: "Pharmacy pickup",
    price: "$6.00",
    date: "22 Feb 2026",
    requester: { firstName: "Tom", lastName: "B" },
    status: "completed",
    distance: "0.8km",
  },
  {
    id: "5",
    title: "Post office drop off",
    price: "$4.00",
    date: "20 Feb 2026",
    requester: { firstName: "Emma", lastName: "W" },
    status: "completed",
    distance: "1.5km",
  },
  {
    id: "6",
    title: "Book return to library",
    price: "$3.50",
    date: "18 Feb 2026",
    requester: { firstName: "Liam", lastName: "O" },
    status: "disputed",
    distance: "2.0km",
  },
];

const FILTER_OPTIONS: { label: string; value: FilterOption }[] = [
  { label: "All", value: "all" },
  { label: "Completed", value: "completed" },
  { label: "Disputed", value: "disputed" },
];

const ErrandHistory = ({ onBack }: { onBack: () => void }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");
  const [selectedErrand, setSelectedErrand] = useState<Errand | null>(null);

  const filteredErrands =
    activeFilter === "all"
      ? MOCK_ERRANDS
      : MOCK_ERRANDS.filter((e) => e.status === activeFilter);

  const totalEarned = MOCK_ERRANDS.filter(
    (e) => e.status === "completed",
  ).reduce((sum, e) => sum + parseFloat(e.price.replace("$", "")), 0);

  const totalCompleted = MOCK_ERRANDS.filter(
    (e) => e.status === "completed",
  ).length;

  const totalDisputed = MOCK_ERRANDS.filter(
    (e) => e.status === "disputed",
  ).length;

  const getStatusColor = (status: ErrandStatus): string =>
    status === "completed" ? colors.success : colors.error;

  const getStatusIcon = (status: ErrandStatus) =>
    status === "completed" ? (
      <CheckCircle size={14} color={colors.success} />
    ) : (
      <AlertTriangle size={14} color={colors.error} />
    );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Nav Header */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <BackButton
          noText
          onBack={onBack}
          icon={<ChevronLeft size={22} color={colors.text} />}
        />

        <Text style={[styles.pageTitle, { color: colors.text }]}>
          Errand History
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={filteredErrands}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Summary Cards */}
            <View style={styles.section}>
              <View style={styles.cardsRow}>
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <TrendingUp size={18} color={colors.success} />
                  <Text style={[styles.cardValue, { color: colors.text }]}>
                    £{totalEarned.toFixed(2)}
                  </Text>
                  <Text
                    style={[styles.cardTitle, { color: colors.textSecondary }]}
                  >
                    Total Earned
                  </Text>
                </View>
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <CheckCircle size={18} color={colors.primary} />
                  <Text style={[styles.cardValue, { color: colors.text }]}>
                    {totalCompleted}
                  </Text>
                  <Text
                    style={[styles.cardTitle, { color: colors.textSecondary }]}
                  >
                    Completed
                  </Text>
                </View>
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <AlertTriangle size={18} color={colors.error} />
                  <Text style={[styles.cardValue, { color: colors.text }]}>
                    {totalDisputed}
                  </Text>
                  <Text
                    style={[styles.cardTitle, { color: colors.textSecondary }]}
                  >
                    Disputed
                  </Text>
                </View>
              </View>
            </View>

            {/* Filter */}
            <View style={styles.filterSection}>
              <Filter size={14} color={colors.textSecondary} />
              <View style={styles.filterRow}>
                {FILTER_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
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
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
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

            <Text style={[styles.resultsCount, { color: colors.textTertiary }]}>
              {filteredErrands.length} errand
              {filteredErrands.length !== 1 ? "s" : ""}
            </Text>
          </>
        }
        renderItem={({ item }) => (
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
                  firstName={item.requester.firstName}
                  lastName={item.requester.lastName}
                  size={38}
                />
                <View>
                  <Text style={[styles.errandTitle, { color: colors.text }]}>
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      styles.errandRequester,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {item.requester.firstName} {item.requester.lastName} ·{" "}
                    {item.distance}
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color={colors.textTertiary} />
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
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
              </View>
              <Text style={[styles.errandDate, { color: colors.textTertiary }]}>
                {item.date}
              </Text>
              <Text style={[styles.errandPrice, { color: colors.primary }]}>
                {item.price}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No errands found
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.textSecondary }]}
            >
              No errands match the selected filter
            </Text>
          </View>
        }
      />

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
            <View
              style={[
                styles.header,
                {
                  borderBottomColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
            >
              <BackButton
                noText
                onBack={onBack}
                icon={<ChevronLeft size={22} color={colors.text} />}
              />
              <Text style={[styles.pageTitle, { color: colors.text }]}>
                Errand Detail
              </Text>
              <View style={{ width: 34 }} />
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
                  {selectedErrand.status.charAt(0).toUpperCase() +
                    selectedErrand.status.slice(1)}
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
                    { label: "Date", value: selectedErrand.date },
                    { label: "Distance", value: selectedErrand.distance },
                    {
                      label: "Requester",
                      value: `${selectedErrand.requester.firstName} ${selectedErrand.requester.lastName}`,
                    },
                    { label: "Earned", value: selectedErrand.price },
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
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
};

export default ErrandHistory;

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
  pageTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  listContent: {
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
  },
  cardsRow: {
    flexDirection: "row",
    gap: 10,
  },
  card: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  cardTitle: {
    fontSize: 11,
  },
  filterSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterOptionText: {
    fontSize: 13,
    fontWeight: "500",
  },
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
  errandTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  errandRequester: {
    fontSize: 12,
  },
  divider: {
    height: 1,
  },
  errandCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  errandDate: {
    fontSize: 12,
  },
  errandPrice: {
    fontSize: 14,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptySubtitle: {
    fontSize: 14,
  },
  modalContent: {
    paddingBottom: 40,
  },
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
  statusBannerText: {
    fontSize: 14,
    fontWeight: "600",
  },
  detailSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  detailCard: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
  },
});
