import { ErrandStatus } from "../schemas/errand";

/**
 * Statuses representing an errand that is still in flight — i.e. not yet
 * terminal (COMPLETED / CANCELLED / EXPIRED / DISPUTED). Both the frontend
 * list filters and the backend "active errand" queries consume this list so
 * the definition of "active" stays consistent across the stack.
 */
export const activeStatuses = [
  "POSTED",
  "ACCEPTED",
  "IN_PROGRESS",
  "REVIEWING",
] as ErrandStatus[];
