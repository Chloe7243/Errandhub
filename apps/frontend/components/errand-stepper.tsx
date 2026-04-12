import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ErrandStatus } from "@errandhub/shared";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

const STEPS: ErrandStatus[] = [
  "POSTED",
  "TENTATIVELY_ACCEPTED",
  "ACCEPTED",
  "IN_PROGRESS",
  "REVIEWING",
  "COMPLETED",
];

const LABELS: Record<ErrandStatus, string> = {
  POSTED: "Posted",
  TENTATIVELY_ACCEPTED: "Pending Review",
  ACCEPTED: "Accepted",
  IN_PROGRESS: "In Progress",
  REVIEWING: "Reviewing",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
  DISPUTED: "Disputed",
};

type Props = {
  currentStep: ErrandStatus;
};

const ErrandStepper = ({ currentStep }: Props) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];

  const currentIndex = STEPS.indexOf(currentStep);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.row}>
        {STEPS.map((step, index) => {
          const isDone = index < currentIndex;
          const isActive = index === currentIndex;

          return (
            <View key={step} style={styles.stepWrapper}>
              {/* Connector line */}
              {index > 0 && (
                <View
                  style={[
                    styles.line,
                    {
                      backgroundColor:
                        index <= currentIndex ? colors.primary : colors.border,
                    },
                  ]}
                />
              )}

              {/* Circle */}
              <View
                style={[
                  styles.circle,
                  {
                    backgroundColor:
                      isDone || isActive ? colors.primary : "transparent",
                    borderColor:
                      isDone || isActive ? colors.primary : colors.border,
                  },
                ]}
              >
                {isDone && <Ionicons name="checkmark" size={14} color="#fff" />}
                {isActive && <View style={styles.activeDot} />}
              </View>

              {/* Label */}
              <Text
                style={[
                  styles.label,
                  {
                    color: isActive
                      ? colors.text
                      : isDone
                        ? colors.textSecondary
                        : colors.textTertiary,
                    fontWeight: isActive ? "700" : "400",
                  },
                ]}
              >
                {LABELS[step]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default ErrandStepper;

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 5,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  stepWrapper: {
    alignItems: "center",
    flex: 1,
    position: "relative",
  },
  line: {
    position: "absolute",
    top: 13,
    right: "50%",
    left: "-50%",
    height: 2,
    zIndex: 0,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 11,
    marginTop: 6,
    textAlign: "center",
  },
});
