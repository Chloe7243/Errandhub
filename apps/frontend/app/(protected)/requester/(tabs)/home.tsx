import Avatar from "@/components/avatar";
import ErrandCard from "@/components/errand-card";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Home = () => {
  const router = useRouter();
  const anyActiveErrands = true;
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];

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
            <Avatar firstName="Alex" lastName="Smith" size={50} />
            <View>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                {"Good Morning,"}
              </Text>
              <Text style={[styles.name, { color: colors.text }]}>
                {"Alex"}
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
            <Text style={[styles.cardValue, { color: colors.text }]}>3</Text>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
              Active Errands
            </Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.background }]}>
            <Text style={[styles.cardValue, { color: colors.text }]}>12</Text>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
              Completed Errands
            </Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.background }]}>
            <Text style={[styles.cardValue, { color: colors.text }]}>4.8</Text>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
              Rating
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
          <Text
            style={{ fontWeight: "600", fontSize: 16, color: colors.primary }}
          >
            View all
          </Text>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.errandCardContainer]}
        >
          {/* Map through active errands here */}
          <ErrandCard
            type="Standard"
            status="active"
            title="Pick up groceries"
            location="2 miles away"
            amount="$15.00"
            time="10 mins ago"
            helperFirstName="John"
            helperLastName="Doe"
            onPress={() => router.push("/requester/errand-details")}
          />
          <ErrandCard
            type="Standard"
            status="active"
            title="Pick up groceries"
            location="2 miles away"
            amount="$15.00"
            time="10 mins ago"
            helperFirstName="John"
            helperLastName="Doe"
            onPress={() => router.push("/requester/errand-details")}
          />
          <ErrandCard
            type="Standard"
            status="active"
            title="Pick up groceries"
            location="2 miles away"
            amount="$15.00"
            time="10 mins ago"
            helperFirstName="John"
            helperLastName="Doe"
            onPress={() => router.push("/requester/errand-details")}
          />
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
    display: "flex",
    flexDirection: "column",
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
