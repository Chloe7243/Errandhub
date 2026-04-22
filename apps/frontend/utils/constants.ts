type constantsObj = { [key: string]: string };

// RTK Query cache tags. Centralised here so every endpoint invalidates/
// provides the same string — typos would silently break refetches.
export const TAGS: constantsObj = {
  USER: "user",
  USER_SETTINGS: "user settings",
  HELPED_ERRANDS: "helped errands",
  REQUESTED_ERRANDS: "requested errands",
  ERRAND: "errand",
  PAYMENT_METHODS: "payment methods",
};

// Single source of truth for the pill/badge colour associated with each
// errand status — used by cards, list filters, and the stepper.
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

export const ERRAND_LOCATION_COLORS: constantsObj = {
  firstLocation: "#8B5CF6",
  currentLocation: "#10B981",
  finalLocation: "#2563EB",
};
