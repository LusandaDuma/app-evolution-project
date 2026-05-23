import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { resolveDashboardRoute } from "@/lib/dashboard-routing";
import { getErrorMessage, logError } from "@/lib/errors";
import { toast } from "sonner";

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
      try {
        const { data, error } = await (supabase as any)
          .from("user_roles")
          .select("role")
          .eq("user_id", session!.user.id);

        if (error) throw error;

        const userRoles = (data ?? []).map((r: { role: string }) => r.role);
        navigate({ to: resolveDashboardRoute(userRoles), replace: true });
      } catch (err) {
        logError("Dashboard", err);
        toast.error(getErrorMessage(err, "dashboard"));
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