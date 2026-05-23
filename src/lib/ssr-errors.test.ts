import { describe, expect, it } from "vitest";
import { isCatastrophicSsrErrorBody } from "./ssr-errors";

describe("isCatastrophicSsrErrorBody", () => {
  it("detects h3 swallowed SSR errors", () => {
    const body = JSON.stringify({
      unhandled: true,
      message: "HTTPError",
      status: 500,
    });
    expect(isCatastrophicSsrErrorBody(body, 500)).toBe(true);
  });

  it("rejects non-JSON bodies", () => {
    expect(isCatastrophicSsrErrorBody("not json", 500)).toBe(false);
  });

  it("rejects JSON with extra keys", () => {
    const body = JSON.stringify({
      unhandled: true,
      message: "HTTPError",
      status: 500,
      extra: true,
    });
    expect(isCatastrophicSsrErrorBody(body, 500)).toBe(false);
  });

  it("rejects successful-looking payloads", () => {
    expect(isCatastrophicSsrErrorBody(JSON.stringify({ ok: true }), 500)).toBe(false);
  });
});
