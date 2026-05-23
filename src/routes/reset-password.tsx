import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import wordmark from "@/assets/imbewu-wordmark.svg";
import { getErrorMessage, logError } from "@/lib/errors";
import { validatePasswordMatch } from "@/lib/password";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Choose a new password — Imbewu" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase auto-signs the user in via the recovery link and emits a
    // PASSWORD_RECOVERY event. Wait for that (or an existing session) before
    // allowing the password update.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const match = validatePasswordMatch(password, confirm);
    if (!match.valid) {
      toast.error(match.message);
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. Welcome back.");
      navigate({ to: "/dashboard" });
    } catch (err) {
      logError("ResetPassword", err);
      toast.error(getErrorMessage(err, "reset-password"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-6 py-16">
      <div className="w-full max-w-sm">
        <img src={wordmark} alt="Imbewu" className="mx-auto mb-10 h-10 w-auto" />
        <h1 className="font-display text-4xl font-medium text-primary">
          Choose a new password.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {ready
            ? "Pick something strong — at least 6 characters."
            : "Verifying your reset link…"}
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
              disabled={!ready}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
              disabled={!ready}
            />
          </div>
          <Button
            type="submit"
            disabled={busy || !ready}
            className="h-11 w-full bg-primary text-primary-foreground shadow-[var(--shadow-luxe)] hover:bg-primary/90"
          >
            {busy ? "Updating…" : "Update password"}
            <ArrowRight />
          </Button>
        </form>
      </div>
    </div>
  );
}
