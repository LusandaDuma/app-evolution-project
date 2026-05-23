import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage, logError } from "@/lib/errors";

export type AppRole = "student" | "coordinator" | "admin" | "independent";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchRoles(userId: string) {
    try {
      const { data, error } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        logError("AuthRoles", error);
        setRoles(["student"]);
        return;
      }

      const fetched = (data ?? []).map((r: { role: AppRole }) => r.role);
      setRoles(fetched.length > 0 ? fetched : ["student"]);
    } catch (err) {
      logError("AuthRoles", getErrorMessage(err, "dashboard"));
      setRoles(["student"]);
    }
  }

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        setSession(data.session);
        if (data.session?.user) {
          await fetchRoles(data.session.user.id);
        }
      })
      .catch((err) => {
        logError("AuthSession", getErrorMessage(err, "auth"));
      })
      .finally(() => {
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          await fetchRoles(newSession.user.id);
        } else {
          setRoles([]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      logError("SignOut", err);
    } finally {
      window.location.href = "/auth";
    }
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, roles, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}