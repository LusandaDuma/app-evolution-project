import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/student")({
  component: StudentDashboard,
});

function StudentDashboard() {
  return <div>Student Dashboard - Coming Soon</div>;
}
