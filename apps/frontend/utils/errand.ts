import { ErrandStatus, ErrandType } from "@errandhub/shared";

/**
 * Map an ErrandType enum value to its user-facing label.
 *
 * The backend stores types as SCREAMING_SNAKE so they stay stable across
 * migrations; this is the single place that maps them to display strings.
 * Kept as a lookup rather than string manipulation so future renames stay
 * explicit and type-checked.
 */
export const formatErrandType = (type: ErrandType): string => {
  const labels: Record<ErrandType, string> = {
    PICKUP_DELIVERY: "Pickup & Delivery",
    SHOPPING: "Shopping",
    HANDS_ON_HELP: "Hands-On Help",
  };
  return labels[type];
};

/**
 * Map an ErrandStatus enum value to its user-facing label. Same rationale
 * as formatErrandType — explicit lookup protects against silent renames.
 */
export const formatErrandStatus = (status: ErrandStatus): string => {
  const labels: Record<ErrandStatus, string> = {
    POSTED: "Posted",
    ACCEPTED: "Accepted",
    IN_PROGRESS: "In Progress",
    REVIEWING: "Reviewing",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    EXPIRED: "Expired",
    DISPUTED: "Disputed",
  };
  return labels[status];
};
