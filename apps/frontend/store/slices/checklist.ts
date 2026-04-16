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

// Helper: parse description string → string[]
// Handles both new JSON format and old plain-text descriptions
export const parseChecklist = (description: string): string[] => {
  try {
    const parsed = JSON.parse(description);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return description ? [description] : [];
};
