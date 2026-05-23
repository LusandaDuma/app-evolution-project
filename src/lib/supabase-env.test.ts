import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSupabaseClientEnv, getSupabaseAdminEnv } from "./supabase-env";

describe("getSupabaseClientEnv", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllEnvs();
  });

  it("throws a clear message when env vars are missing", () => {
    expect(() => getSupabaseClientEnv()).toThrow(/Supabase is not configured/);
    expect(() => getSupabaseClientEnv()).toThrow(/VITE_SUPABASE_URL/);
  });

  it("reads from process.env on the server", () => {
    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_PUBLISHABLE_KEY = "test-anon-key";
    expect(getSupabaseClientEnv()).toEqual({
      url: "https://test.supabase.co",
      publishableKey: "test-anon-key",
    });
  });
});

describe("getSupabaseAdminEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it("throws when service role key is missing", () => {
    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_PUBLISHABLE_KEY = "test-anon-key";
    expect(() => getSupabaseAdminEnv()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });
});
