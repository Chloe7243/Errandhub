type constantsObj = { [key: string]: string };

export const TAGS: constantsObj = {
  USER: "user",
  USER_SETTINGS: "user settings",
  HELPED_ERRANDS: "helped errands",
  REQUESTED_ERRANDS: "requested errands",
  ERRAND: "errand",
  PAYMENT_METHODS: "payment methods",
};

export const STATUS_COLORS: constantsObj = {
  POSTED: "#F59E0B",
  ACCEPTED: "#3B82F6",
  IN_PROGRESS: "#6366F1",
  REVIEWING: "#8B5CF6",
  COMPLETED: "#10B981",
  CANCELLED: "#EF4444",
  EXPIRED: "#6B7280",
  DISPUTED: "#EF4444",
};
