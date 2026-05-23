import { describe, expect, it } from "vitest";
import {
  getPasswordRequirements,
  isPasswordValid,
  validatePasswordMatch,
} from "./password";

describe("getPasswordRequirements", () => {
  it("fails weak passwords", () => {
    const req = getPasswordRequirements("abc");
    expect(req.minLength).toBe(false);
    expect(req.uppercase).toBe(false);
    expect(req.number).toBe(false);
  });

  it("passes strong passwords", () => {
    const req = getPasswordRequirements("Secure1!");
    expect(req).toEqual({
      minLength: true,
      uppercase: true,
      lowercase: true,
      number: true,
      special: true,
    });
  });
});

describe("isPasswordValid", () => {
  it("returns false for weak password", () => {
    expect(isPasswordValid("short")).toBe(false);
  });

  it("returns true for valid password", () => {
    expect(isPasswordValid("Secure1!")).toBe(true);
  });
});

describe("validatePasswordMatch", () => {
  it("rejects mismatched passwords with clear message", () => {
    const result = validatePasswordMatch("abc123", "xyz789");
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.message).toContain("do not match");
    }
  });

  it("rejects short passwords", () => {
    const result = validatePasswordMatch("ab", "ab");
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.message).toContain("at least 6 characters");
    }
  });

  it("accepts matching valid passwords", () => {
    expect(validatePasswordMatch("secure12", "secure12")).toEqual({ valid: true });
  });
});
