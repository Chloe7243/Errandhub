import {
  errandStatusEnum,
  errandTypeEnum,
  createErrandSchema,
} from "../../../shared/schemas/errand";

const validBase = {
  title: "Pick up my parcel",
  description: JSON.stringify(["Ring doorbell on arrival"]),
  firstLocation: "123 High Street",
  finalLocation: "456 Park Road",
  type: "PICKUP_DELIVERY" as const,
};

describe("errandStatusEnum", () => {
  const valid = [
    "POSTED",
    "ACCEPTED",
    "IN_PROGRESS",
    "REVIEWING",
    "COMPLETED",
    "CANCELLED",
    "EXPIRED",
    "DISPUTED",
  ];

  valid.forEach((status) => {
    it(`accepts "${status}"`, () => {
      expect(errandStatusEnum.safeParse(status).success).toBe(true);
    });
  });

  it("rejects an unknown status", () => {
    expect(errandStatusEnum.safeParse("PENDING").success).toBe(false);
  });
});

describe("errandTypeEnum", () => {
  it("accepts PICKUP_DELIVERY", () => {
    expect(errandTypeEnum.safeParse("PICKUP_DELIVERY").success).toBe(true);
  });

  it("accepts SHOPPING", () => {
    expect(errandTypeEnum.safeParse("SHOPPING").success).toBe(true);
  });

  it("accepts HANDS_ON_HELP", () => {
    expect(errandTypeEnum.safeParse("HANDS_ON_HELP").success).toBe(true);
  });

  it("rejects an unknown type", () => {
    expect(errandTypeEnum.safeParse("COURIER").success).toBe(false);
  });
});

describe("createErrandSchema", () => {
  describe("PICKUP_DELIVERY", () => {
    it("passes when all required fields are present", () => {
      expect(createErrandSchema.safeParse(validBase).success).toBe(true);
    });

    it("fails when finalLocation is missing", () => {
      const { finalLocation, ...rest } = validBase;
      const result = createErrandSchema.safeParse(rest);
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path[0]);
        expect(paths).toContain("finalLocation");
      }
    });
  });

  describe("SHOPPING", () => {
    it("passes when finalLocation is provided", () => {
      const result = createErrandSchema.safeParse({
        ...validBase,
        type: "SHOPPING",
      });
      expect(result.success).toBe(true);
    });

    it("fails when finalLocation is missing", () => {
      const { finalLocation, ...rest } = validBase;
      const result = createErrandSchema.safeParse({ ...rest, type: "SHOPPING" });
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path[0]);
        expect(paths).toContain("finalLocation");
      }
    });
  });

  describe("HANDS_ON_HELP", () => {
    it("passes when estimatedDuration is provided", () => {
      const result = createErrandSchema.safeParse({
        ...validBase,
        type: "HANDS_ON_HELP",
        estimatedDuration: 2,
      });
      expect(result.success).toBe(true);
    });

    it("fails when estimatedDuration is missing", () => {
      const result = createErrandSchema.safeParse({
        ...validBase,
        type: "HANDS_ON_HELP",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path[0]);
        expect(paths).toContain("estimatedDuration");
      }
    });

    it("does not require finalLocation", () => {
      const { finalLocation, ...rest } = validBase;
      const result = createErrandSchema.safeParse({
        ...rest,
        type: "HANDS_ON_HELP",
        estimatedDuration: 1,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("required field validation", () => {
    it("fails when title is empty", () => {
      const result = createErrandSchema.safeParse({ ...validBase, title: "" });
      expect(result.success).toBe(false);
    });

    it("fails when description is empty", () => {
      const result = createErrandSchema.safeParse({
        ...validBase,
        description: "",
      });
      expect(result.success).toBe(false);
    });

    it("fails when firstLocation is empty", () => {
      const result = createErrandSchema.safeParse({
        ...validBase,
        firstLocation: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("optional fields", () => {
    it("accepts optional coordinate fields", () => {
      const result = createErrandSchema.safeParse({
        ...validBase,
        firstLat: 51.5074,
        firstLng: -0.1278,
        finalLat: 51.51,
        finalLng: -0.13,
      });
      expect(result.success).toBe(true);
    });

    it("accepts optional locationReference", () => {
      const result = createErrandSchema.safeParse({
        ...validBase,
        locationReference: "Name: Alice, Code: #123",
      });
      expect(result.success).toBe(true);
    });
  });
});
