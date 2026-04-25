import checklistReducer, {
  toggleItem,
  clearProgress,
  parseChecklist,
} from "../../../../apps/frontend/store/slices/checklist";

describe("checklist slice", () => {
  it("returns the initial state", () => {
    expect(checklistReducer(undefined, { type: "@@INIT" })).toEqual({
      progress: {},
    });
  });

  describe("toggleItem", () => {
    it("initialises a new errand with all false then sets the toggled index to true", () => {
      const state = checklistReducer(
        undefined,
        toggleItem({ errandId: "e1", index: 1, total: 3 }),
      );
      expect(state.progress["e1"]).toEqual([false, true, false]);
    });

    it("toggles true back to false on a second dispatch", () => {
      let state = checklistReducer(
        undefined,
        toggleItem({ errandId: "e1", index: 0, total: 2 }),
      );
      state = checklistReducer(
        state,
        toggleItem({ errandId: "e1", index: 0, total: 2 }),
      );
      expect(state.progress["e1"][0]).toBe(false);
    });

    it("keeps separate progress arrays for different errands", () => {
      let state = checklistReducer(
        undefined,
        toggleItem({ errandId: "e1", index: 0, total: 2 }),
      );
      state = checklistReducer(
        state,
        toggleItem({ errandId: "e2", index: 1, total: 3 }),
      );
      expect(state.progress["e1"]).toEqual([true, false]);
      expect(state.progress["e2"]).toEqual([false, true, false]);
    });

    it("reuses the existing array when the errand already has progress", () => {
      // First toggle initialises [true, false]
      let state = checklistReducer(
        undefined,
        toggleItem({ errandId: "e1", index: 0, total: 2 }),
      );
      // Second toggle flips index 1 without re-initialising
      state = checklistReducer(
        state,
        toggleItem({ errandId: "e1", index: 1, total: 2 }),
      );
      expect(state.progress["e1"]).toEqual([true, true]);
    });
  });

  describe("clearProgress", () => {
    it("removes the errand entry from progress", () => {
      let state = checklistReducer(
        undefined,
        toggleItem({ errandId: "e1", index: 0, total: 2 }),
      );
      state = checklistReducer(state, clearProgress("e1"));
      expect(state.progress["e1"]).toBeUndefined();
    });

    it("does not affect progress for other errands", () => {
      let state = checklistReducer(
        undefined,
        toggleItem({ errandId: "e1", index: 0, total: 1 }),
      );
      state = checklistReducer(
        state,
        toggleItem({ errandId: "e2", index: 0, total: 1 }),
      );
      state = checklistReducer(state, clearProgress("e1"));
      expect(state.progress["e2"]).toEqual([true]);
    });
  });
});

describe("parseChecklist", () => {
  it("parses a valid JSON array of strings", () => {
    const items = ["Buy milk", "Pick up parcel"];
    expect(parseChecklist(JSON.stringify(items))).toEqual(items);
  });

  it("falls back to a single-item array for plain text", () => {
    expect(parseChecklist("Deliver the package")).toEqual([
      "Deliver the package",
    ]);
  });

  it("falls back for a JSON string that is not an array", () => {
    // JSON.parse succeeds but result is not an array
    expect(parseChecklist('"just a quoted string"')).toEqual([
      '"just a quoted string"',
    ]);
  });

  it("returns an empty array for an empty string", () => {
    expect(parseChecklist("")).toEqual([]);
  });

  it("returns an empty array for a JSON empty array", () => {
    // Empty array has length 0 so the guard rejects it
    expect(parseChecklist("[]")).toEqual([]);
  });

  it("falls back gracefully for malformed JSON", () => {
    expect(parseChecklist("{not valid json}")).toEqual(["{not valid json}"]);
  });
});
