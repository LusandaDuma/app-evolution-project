import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/grower")({
  component: GrowerDashboard,
});

function GrowerDashboard() {
  return <div>Grower Dashboard - Coming Soon</div>;
}
