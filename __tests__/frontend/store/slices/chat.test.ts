import chatReducer, {
  addMessage,
  setMessages,
  clearMessages,
  Message,
} from "../../../../apps/frontend/store/slices/chat";

const msg1: Message = {
  id: "m1",
  senderId: "u1",
  content: "Hello",
  createdAt: "2024-01-01T10:00:00Z",
};

const msg2: Message = {
  id: "m2",
  senderId: "u2",
  content: "Hi there",
  createdAt: "2024-01-01T10:01:00Z",
};

describe("chat slice", () => {
  it("returns the initial state", () => {
    expect(chatReducer(undefined, { type: "@@INIT" })).toEqual({
      messagesByErrand: {},
    });
  });

  describe("addMessage", () => {
    it("creates a new errand entry and adds the message", () => {
      const state = chatReducer(
        undefined,
        addMessage({ errandId: "e1", message: msg1 }),
      );
      expect(state.messagesByErrand["e1"]).toHaveLength(1);
      expect(state.messagesByErrand["e1"][0]).toEqual(msg1);
    });

    it("appends to an existing errand's message list", () => {
      let state = chatReducer(
        undefined,
        addMessage({ errandId: "e1", message: msg1 }),
      );
      state = chatReducer(state, addMessage({ errandId: "e1", message: msg2 }));
      expect(state.messagesByErrand["e1"]).toHaveLength(2);
    });

    it("does not add a duplicate message with the same id", () => {
      let state = chatReducer(
        undefined,
        addMessage({ errandId: "e1", message: msg1 }),
      );
      state = chatReducer(state, addMessage({ errandId: "e1", message: msg1 }));
      expect(state.messagesByErrand["e1"]).toHaveLength(1);
    });

    it("keeps separate lists for different errands", () => {
      let state = chatReducer(
        undefined,
        addMessage({ errandId: "e1", message: msg1 }),
      );
      state = chatReducer(state, addMessage({ errandId: "e2", message: msg2 }));
      expect(state.messagesByErrand["e1"]).toHaveLength(1);
      expect(state.messagesByErrand["e2"]).toHaveLength(1);
    });
  });

  describe("setMessages", () => {
    it("replaces all messages for an errand", () => {
      let state = chatReducer(
        undefined,
        addMessage({ errandId: "e1", message: msg1 }),
      );
      state = chatReducer(
        state,
        setMessages({ errandId: "e1", messages: [msg2] }),
      );
      expect(state.messagesByErrand["e1"]).toHaveLength(1);
      expect(state.messagesByErrand["e1"][0]).toEqual(msg2);
    });
  });

  describe("clearMessages", () => {
    it("removes the entire errand message list", () => {
      let state = chatReducer(
        undefined,
        addMessage({ errandId: "e1", message: msg1 }),
      );
      state = chatReducer(state, clearMessages("e1"));
      expect(state.messagesByErrand["e1"]).toBeUndefined();
    });

    it("does not affect other errands", () => {
      let state = chatReducer(
        undefined,
        addMessage({ errandId: "e1", message: msg1 }),
      );
      state = chatReducer(state, addMessage({ errandId: "e2", message: msg2 }));
      state = chatReducer(state, clearMessages("e1"));
      expect(state.messagesByErrand["e2"]).toHaveLength(1);
    });
  });
});
