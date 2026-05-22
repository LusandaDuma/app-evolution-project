import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Imbewu" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!session) { navigate({ to: "/auth" }); return; }

    // Fetch role directly here — bypass useAuth roles entirely
    async function getRole() {
      const { data } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", session!.user.id);

      const userRoles = (data ?? []).map((r: { role: string }) => r.role);

      if (userRoles.includes("admin")) {
        navigate({ to: "/dashboard/admin", replace: true });
      } else if (userRoles.includes("coordinator")) {
        navigate({ to: "/dashboard/coordinator", replace: true });
      } else if (userRoles.includes("independent")) {
        navigate({ to: "/dashboard/grower", replace: true });
      } else {
        navigate({ to: "/dashboard/student", replace: true });
      }
    }

    getRole();
  }, [loading, session, navigate]);

  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <p className="font-display text-2xl text-primary">Cultivating…</p>
    </div>
  );
}