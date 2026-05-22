import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/coordinator")({
  component: CoordinatorDashboard,
});

function CoordinatorDashboard() {
  return <div>Coordinator Dashboard - Coming Soon</div>;
}
