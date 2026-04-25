import matchingReducer, {
  setHelperRequest,
  clearHelperRequest,
  setCounterOffer,
  clearCounterOffer,
  setErrandExpired,
  clearErrandExpired,
  setErrandAssigned,
  clearErrandAssigned,
  resetMatching,
  ErrandRequestPayload,
  CounterOfferPayload,
} from "../../../../apps/frontend/store/slices/matching";

const mockRequest: ErrandRequestPayload = {
  errandId: "e1",
  title: "Pick up parcel",
  description: JSON.stringify(["Collect from reception"]),
  firstLocation: "123 High St",
  finalLocation: "456 Park Rd",
  suggestedPrice: 5,
  type: "PICKUP_DELIVERY",
  requester: { id: "r1", firstName: "Alice", lastName: "Smith", avatarUrl: null },
  expiresAt: new Date(Date.now() + 30000).toISOString(),
};

const mockOffer: CounterOfferPayload = {
  errandId: "e1",
  helper: { id: "h1", firstName: "Bob", lastName: "Jones" },
  amount: 8,
  expiresAt: new Date(Date.now() + 30000).toISOString(),
};

describe("matching slice", () => {
  it("returns the initial state", () => {
    expect(matchingReducer(undefined, { type: "@@INIT" })).toEqual({
      helperRequest: null,
      counterOffer: null,
      expiredErrandId: null,
      assignedErrandId: null,
    });
  });

  describe("helperRequest", () => {
    it("setHelperRequest stores the incoming errand request", () => {
      const state = matchingReducer(undefined, setHelperRequest(mockRequest));
      expect(state.helperRequest).toEqual(mockRequest);
    });

    it("clearHelperRequest removes the request", () => {
      let state = matchingReducer(undefined, setHelperRequest(mockRequest));
      state = matchingReducer(state, clearHelperRequest());
      expect(state.helperRequest).toBeNull();
    });
  });

  describe("counterOffer", () => {
    it("setCounterOffer stores the offer", () => {
      const state = matchingReducer(undefined, setCounterOffer(mockOffer));
      expect(state.counterOffer).toEqual(mockOffer);
    });

    it("clearCounterOffer removes the offer", () => {
      let state = matchingReducer(undefined, setCounterOffer(mockOffer));
      state = matchingReducer(state, clearCounterOffer());
      expect(state.counterOffer).toBeNull();
    });
  });

  describe("errand expiry", () => {
    it("setErrandExpired records the errand id", () => {
      const state = matchingReducer(
        undefined,
        setErrandExpired({ errandId: "e1" }),
      );
      expect(state.expiredErrandId).toBe("e1");
    });

    it("clearErrandExpired removes the id", () => {
      let state = matchingReducer(
        undefined,
        setErrandExpired({ errandId: "e1" }),
      );
      state = matchingReducer(state, clearErrandExpired());
      expect(state.expiredErrandId).toBeNull();
    });
  });

  describe("errand assignment", () => {
    it("setErrandAssigned records the errand id", () => {
      const state = matchingReducer(
        undefined,
        setErrandAssigned({ errandId: "e1" }),
      );
      expect(state.assignedErrandId).toBe("e1");
    });

    it("clearErrandAssigned removes the id", () => {
      let state = matchingReducer(
        undefined,
        setErrandAssigned({ errandId: "e1" }),
      );
      state = matchingReducer(state, clearErrandAssigned());
      expect(state.assignedErrandId).toBeNull();
    });
  });

  describe("resetMatching", () => {
    it("clears all matching state at once", () => {
      let state = matchingReducer(undefined, setHelperRequest(mockRequest));
      state = matchingReducer(state, setCounterOffer(mockOffer));
      state = matchingReducer(state, setErrandExpired({ errandId: "e1" }));
      state = matchingReducer(state, setErrandAssigned({ errandId: "e1" }));

      state = matchingReducer(state, resetMatching());

      expect(state.helperRequest).toBeNull();
      expect(state.counterOffer).toBeNull();
      expect(state.expiredErrandId).toBeNull();
      expect(state.assignedErrandId).toBeNull();
    });
  });
});
