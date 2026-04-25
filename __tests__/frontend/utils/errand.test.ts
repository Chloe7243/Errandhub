import {
  formatErrandType,
  formatErrandStatus,
} from "../../../apps/frontend/utils/errand";

describe("formatErrandType", () => {
  it('formats PICKUP_DELIVERY as "Pickup & Delivery"', () => {
    expect(formatErrandType("PICKUP_DELIVERY")).toBe("Pickup & Delivery");
  });

  it('formats SHOPPING as "Shopping"', () => {
    expect(formatErrandType("SHOPPING")).toBe("Shopping");
  });

  it('formats HANDS_ON_HELP as "Hands-On Help"', () => {
    expect(formatErrandType("HANDS_ON_HELP")).toBe("Hands-On Help");
  });
});

describe("formatErrandStatus", () => {
  const cases: [string, string][] = [
    ["POSTED", "Posted"],
    ["ACCEPTED", "Accepted"],
    ["IN_PROGRESS", "In Progress"],
    ["REVIEWING", "Reviewing"],
    ["COMPLETED", "Completed"],
    ["CANCELLED", "Cancelled"],
    ["EXPIRED", "Expired"],
    ["DISPUTED", "Disputed"],
  ];

  cases.forEach(([status, expected]) => {
    it(`formats ${status} as "${expected}"`, () => {
      expect(formatErrandStatus(status as any)).toBe(expected);
    });
  });
});
