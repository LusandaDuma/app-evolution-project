import { describe, expect, it } from "vitest";
import { resolveDashboardRoute } from "./dashboard-routing";

describe("resolveDashboardRoute", () => {
  it("routes admin first when multiple roles", () => {
    expect(resolveDashboardRoute(["student", "admin"])).toBe("/dashboard/admin");
  });

  it("routes coordinator", () => {
    expect(resolveDashboardRoute(["coordinator"])).toBe("/dashboard/coordinator");
  });

  it("routes independent growers to grower dashboard", () => {
    expect(resolveDashboardRoute(["independent"])).toBe("/dashboard/grower");
  });

  it("defaults to student when no roles", () => {
    expect(resolveDashboardRoute([])).toBe("/dashboard/student");
  });

  it("defaults to student for unknown roles", () => {
    expect(resolveDashboardRoute(["unknown"])).toBe("/dashboard/student");
  });
});
