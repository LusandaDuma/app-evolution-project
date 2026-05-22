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
        .from("profiles")
        .select("role")
        .eq("id", session!.user.id)
        .maybeSingle();

      const role = data?.role ?? "student";

      if (role === "admin") {
        navigate({ to: "/dashboard/admin", replace: true });
      } else if (role === "coordinator") {
        navigate({ to: "/dashboard/coordinator", replace: true });
      } else if (role === "independent") {
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