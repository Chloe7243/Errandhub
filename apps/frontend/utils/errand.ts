import { ErrandStatus, ErrandType } from "@errandhub/shared";

export const formatErrandType = (type: ErrandType): string => {
  const labels: Record<ErrandType, string> = {
    PICKUP_DELIVERY: "Pickup & Delivery",
    SHOPPING: "Shopping",
  };
  return labels[type];
};

export const formatErrandStatus = (status: ErrandStatus): string => {
  const labels: Record<ErrandStatus, string> = {
    POSTED: "Posted",
    ACCEPTED: "Accepted",
    IN_PROGRESS: "In Progress",
    REVIEWING: "Reviewing",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    DISPUTED: "Disputed",
  };
  return labels[status];
};
