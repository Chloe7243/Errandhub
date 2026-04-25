import {
  signUpSchema,
  loginSchema,
  forgetPasswordSchema,
  resetPasswordSchema,
} from "../../../shared/schemas/user";

const validSignUp = {
  firstName: "Alice",
  lastName: "Smith",
  email: "alice@university.ac.uk",
  phone: "07911123456",
  password: "securepassword",
};

describe("signUpSchema", () => {
  describe("email validation", () => {
    it("accepts a UK university email (.ac.uk)", () => {
      expect(signUpSchema.safeParse(validSignUp).success).toBe(true);
    });

    it("accepts a US university email (.edu)", () => {
      const result = signUpSchema.safeParse({
        ...validSignUp,
        email: "alice@mit.edu",
      });
      expect(result.success).toBe(true);
    });

    it("rejects a Gmail address", () => {
      const result = signUpSchema.safeParse({
        ...validSignUp,
        email: "alice@gmail.com",
      });
      expect(result.success).toBe(false);
    });

    it("rejects a non-university domain", () => {
      const result = signUpSchema.safeParse({
        ...validSignUp,
        email: "alice@company.com",
      });
      expect(result.success).toBe(false);
    });

    it("lowercases the email before storing", () => {
      const result = signUpSchema.safeParse({
        ...validSignUp,
        email: "ALICE@University.AC.UK",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("alice@university.ac.uk");
      }
    });
  });

  describe("phone validation", () => {
    it("accepts a plain 11-digit number", () => {
      expect(signUpSchema.safeParse(validSignUp).success).toBe(true);
    });

    it("accepts a number with country code prefix", () => {
      const result = signUpSchema.safeParse({
        ...validSignUp,
        phone: "+447911123456",
      });
      expect(result.success).toBe(true);
    });

    it("accepts a number with spaces and strips them", () => {
      const result = signUpSchema.safeParse({
        ...validSignUp,
        phone: "+44 7911 123 456",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.phone).toBe("+447911123456");
      }
    });

    it("accepts a number with dashes and strips them", () => {
      const result = signUpSchema.safeParse({
        ...validSignUp,
        phone: "07911-123-456",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.phone).toBe("07911123456");
      }
    });

    it("accepts a number with parentheses and strips them", () => {
      const result = signUpSchema.safeParse({
        ...validSignUp,
        phone: "(079) 11123456",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.phone).toBe("07911123456");
      }
    });

    it("rejects a number that is too short", () => {
      const result = signUpSchema.safeParse({ ...validSignUp, phone: "123" });
      expect(result.success).toBe(false);
    });

    it("rejects a number that is too long", () => {
      const result = signUpSchema.safeParse({
        ...validSignUp,
        phone: "+447911123456789012345",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("password validation", () => {
    it("accepts an 8-character password", () => {
      const result = signUpSchema.safeParse({
        ...validSignUp,
        password: "12345678",
      });
      expect(result.success).toBe(true);
    });

    it("rejects a password shorter than 8 characters", () => {
      const result = signUpSchema.safeParse({
        ...validSignUp,
        password: "short",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("name validation", () => {
    it("rejects an empty firstName", () => {
      const result = signUpSchema.safeParse({ ...validSignUp, firstName: "" });
      expect(result.success).toBe(false);
    });

    it("rejects an empty lastName", () => {
      const result = signUpSchema.safeParse({ ...validSignUp, lastName: "" });
      expect(result.success).toBe(false);
    });
  });
});

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({
      email: "alice@university.ac.uk",
      password: "anypassword",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "anypassword",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({
      email: "alice@university.ac.uk",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("lowercases the email", () => {
    const result = loginSchema.safeParse({
      email: "ALICE@UNIVERSITY.AC.UK",
      password: "password",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("alice@university.ac.uk");
    }
  });
});

describe("forgetPasswordSchema", () => {
  it("accepts a valid email", () => {
    expect(
      forgetPasswordSchema.safeParse({ email: "alice@uni.ac.uk" }).success,
    ).toBe(true);
  });

  it("rejects a malformed email", () => {
    expect(
      forgetPasswordSchema.safeParse({ email: "not-an-email" }).success,
    ).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("accepts a valid token and password", () => {
    const result = resetPasswordSchema.safeParse({
      token: "some-uuid-token",
      password: "newpassword",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty token", () => {
    const result = resetPasswordSchema.safeParse({
      token: "",
      password: "newpassword",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = resetPasswordSchema.safeParse({
      token: "some-uuid-token",
      password: "short",
    });
    expect(result.success).toBe(false);
  });
});
