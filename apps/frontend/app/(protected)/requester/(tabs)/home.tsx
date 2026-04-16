import Avatar from "@/components/avatar";
import EmptyState from "@/components/empty-state";
import ErrandCard from "@/components/errand-card";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useGetRequestedErrandsQuery } from "@/store/api/user";
import { useAppSelector } from "@/store/hooks";
import { User } from "@/types";
import { activeStatuses } from "@errandhub/shared";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Home = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const user = useAppSelector((state) => state.auth.user) as User;

  const { currentData: activeErrands, isLoading } = useGetRequestedErrandsQuery(
    { status: activeStatuses },
    { refetchOnMountOrArgChange: true },
  );

  const { totalActive = 0, totalCompleted = 0, totalErrands = 0 } =
    activeErrands?.summary ?? {};
  const anyActiveErrands = (activeErrands?.errands.length ?? 0) > 0;

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning,";
    if (hour < 18) return "Good afternoon,";
    return "Good evening,";
  })();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.backgroundSecondary,
            paddingTop: insets.top + 16,
          },
        ]}
      >
        <View style={[styles.userInfoContainer]}>
          <View style={[styles.userInfo]}>
            <Avatar
              firstName={user?.firstName}
              lastName={user?.lastName}
              size={50}
            />
            <View>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                {greeting}
              </Text>
              <Text style={[styles.name, { color: colors.text }]}>
                {user?.firstName || ""}
              </Text>
            </View>
          </View>
          {/* Emergency FAB */}
          {anyActiveErrands && (
            <TouchableOpacity
              style={[styles.fab, { backgroundColor: colors.error }]}
              onPress={() => router.push("/requester/emergency")}
            >
              <Ionicons name="warning-outline" size={22} color={colors.text} />
              {/* <Text style={[styles.fabText, { color: colors.text }]}>
                Need help?
              </Text> */}
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.info]}>
          <View style={[styles.card, { backgroundColor: colors.background }]}>
            <Text style={[styles.cardValue, { color: colors.text }]}>
              {totalActive}
            </Text>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
              Active Errands
            </Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.background }]}>
            <Text style={[styles.cardValue, { color: colors.text }]}>
              {totalCompleted}
            </Text>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
              Completed
            </Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.background }]}>
            <Text style={[styles.cardValue, { color: colors.text }]}>
              {totalErrands}
            </Text>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
              Total Errands
            </Text>
          </View>
        </View>

        {/* <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary }]}
        >
          <FontAwesome5 name="plus" size={20} color={"#fff"} />
          <Text style={[styles.createButtonText, { color: "#fff" }]}>
            Create New Errand
          </Text>
        </TouchableOpacity> */}
      </View>
      <View style={[styles.content]}>
        <View style={styles.contentHeader}>
          <Text style={[styles.title, { color: colors.text }]}>
            Active Errands
          </Text>
          <Link
            href="/requester/errands"
            style={{ fontWeight: "600", fontSize: 16, color: colors.primary }}
          >
            View all
          </Link>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.errandCardContainer]}
        >
          {isLoading ? (
            <LoadingSpinner fullScreen color="#fff" customSize={1.5} />
          ) : !anyActiveErrands ? (
            <EmptyState
              fullScreen
              message="No active errands available"
              icon="notifications-off-outline"
            />
          ) : (
            activeErrands?.errands.map((errand: any) => {
              return (
                <ErrandCard
                  key={errand?.id}
                  type={errand?.type}
                  status={errand?.status}
                  title={errand?.title}
                  location={errand?.pickupLocation}
                  amount={errand?.agreedPrice}
                  helperFirstName={errand?.helper?.firstName}
                  helperLastName={errand?.helper?.lastName}
                  onPress={() =>
                    router.push(
                      `/requester/errand-details?id=${errand?.id || ""}`,
                    )
                  }
                />
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
    paddingHorizontal: 16,
    paddingVertical: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  userInfoContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  greeting: {
    fontSize: 14,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  info: {
    flexDirection: "row",
    gap: 12,
  },
  card: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 14,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 12,
    textAlign: "center",
  },
  createButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
  },
  contentHeader: {
    display: "flex",
    flexDirection: "row",
    paddingVertical: 8,
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  errandCardContainer: {
    gap: 20,
  },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 15,
    borderRadius: 999,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: { fontWeight: "700", fontSize: 14 },
});
