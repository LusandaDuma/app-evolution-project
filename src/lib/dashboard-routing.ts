export type DashboardRoute =
  | "/dashboard/admin"
  | "/dashboard/coordinator"
  | "/dashboard/grower"
  | "/dashboard/student";

const ROLE_PRIORITY: { role: string; route: DashboardRoute }[] = [
  { role: "admin", route: "/dashboard/admin" },
  { role: "coordinator", route: "/dashboard/coordinator" },
  { role: "independent", route: "/dashboard/grower" },
  { role: "student", route: "/dashboard/student" },
];

/**
 * Picks the highest-priority dashboard route for the user's roles.
 * Defaults to student when no roles are assigned.
 */
export function resolveDashboardRoute(roles: string[]): DashboardRoute {
  for (const { role, route } of ROLE_PRIORITY) {
    if (roles.includes(role)) return route;
  }
  return "/dashboard/student";
}
