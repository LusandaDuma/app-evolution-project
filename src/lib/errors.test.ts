import { describe, expect, it } from "vitest";
import {
  getErrorMessage,
  mapSupabaseAuthError,
  missingSupabaseEnvMessage,
} from "./errors";

describe("mapSupabaseAuthError", () => {
  it("maps invalid login credentials", () => {
    expect(
      mapSupabaseAuthError({ message: "Invalid login credentials" }),
    ).toContain("Incorrect email or password");
  });

  it("maps email not confirmed", () => {
    expect(mapSupabaseAuthError({ message: "Email not confirmed" })).toContain(
      "confirm your email",
    );
  });

  it("maps rate limiting", () => {
    expect(mapSupabaseAuthError({ message: "Too many requests" })).toContain(
      "Too many attempts",
    );
  });

  it("maps known error codes", () => {
    expect(mapSupabaseAuthError({ code: "user_already_registered" })).toContain(
      "already exists",
    );
  });

  it("falls back for unknown errors", () => {
    expect(mapSupabaseAuthError(null)).toBe(
      "Authentication failed. Please try again.",
    );
  });
});

describe("getErrorMessage", () => {
  it("returns string errors as-is", () => {
    expect(getErrorMessage("Custom failure")).toBe("Custom failure");
  });

  it("uses auth context fallback", () => {
    expect(getErrorMessage({}, "auth")).toContain("Sign in failed");
  });

  it("uses signup context for Supabase errors", () => {
    expect(
      getErrorMessage({ message: "User already registered" }, "signup"),
    ).toContain("already exists");
  });

  it("uses reset-password context fallback", () => {
    expect(getErrorMessage(null, "reset-password")).toContain(
      "reset link may have expired",
    );
  });
});

describe("missingSupabaseEnvMessage", () => {
  it("lists missing variables clearly", () => {
    const msg = missingSupabaseEnvMessage(["VITE_SUPABASE_URL"]);
    expect(msg).toContain("VITE_SUPABASE_URL");
    expect(msg).toContain(".env");
    expect(msg).toContain("Vercel");
  });
});
