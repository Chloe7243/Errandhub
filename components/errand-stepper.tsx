import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

type Step = "posted" | "accepted" | "in_progress" | "reviewing" | "completed";

const STEPS: Step[] = [
  "posted",
  "accepted",
  "in_progress",
  "reviewing",
  "completed",
];

const LABELS: Record<Step, string> = {
  posted: "Posted",
  accepted: "Accepted",
  in_progress: "In Progress",
  reviewing: "Reviewing",
  completed: "Completed",
};

type Props = {
  currentStep: Step;
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
