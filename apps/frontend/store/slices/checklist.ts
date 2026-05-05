// Per-errand shopping/delivery checklist progress. Only the booleans live
// here — the item labels themselves are parsed from the errand description
// (see parseChecklist below) so they stay authoritative on the backend.
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type ChecklistState = {
  // errandId → array of booleans, one per checklist item
  progress: { [errandId: string]: boolean[] };
};

const initialState: ChecklistState = { progress: {} };

const checklistSlice = createSlice({
  name: "checklist",
  initialState,
  reducers: {
    toggleItem(
      state,
      action: PayloadAction<{ errandId: string; index: number; total: number }>,
    ) {
      const { errandId, index, total } = action.payload;
      if (!state.progress[errandId]) {
        state.progress[errandId] = Array(total).fill(false);
      }
      state.progress[errandId][index] = !state.progress[errandId][index];
    },
    clearProgress(state, action: PayloadAction<string>) {
      delete state.progress[action.payload];
    },
  },
});

export const { toggleItem, clearProgress } = checklistSlice.actions;
export default checklistSlice.reducer;

/**
 * Extract a checklist of items from an errand description.
 *
 * New errands store the checklist as a JSON-encoded string array inside
 * the description field; older errands (and freeform descriptions) are
 * plain text. This helper transparently supports both: a parseable JSON
 * array is returned as-is, anything else falls back to a single-item
 * array so callers can treat the output uniformly.
 */
export const parseChecklist = (description: string): string[] => {
  try {
    const parsed = JSON.parse(description);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return description ? [description] : [];
};
