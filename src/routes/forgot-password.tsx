import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import wordmark from "@/assets/imbewu-wordmark.svg";
import { getErrorMessage, logError } from "@/lib/errors";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — Imbewu" }] }),
  component: ForgotPasswordPage,
});

const COOLDOWN_SECONDS = 60;

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const lastSentEmailRef = useRef<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy || cooldown > 0) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      lastSentEmailRef.current = email;
      setSent(true);
      setCooldown(COOLDOWN_SECONDS);
      toast.success("Check your inbox for the reset link.");
    } catch (err) {
      logError("ForgotPassword", err);
      toast.error(getErrorMessage(err, "forgot-password"));
    } finally {
      setBusy(false);
    }
  }

  const disabled = busy || cooldown > 0 || email.length === 0;

  return (
    <div className="grid min-h-screen place-items-center bg-background px-6 py-16">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-10 block">
          <img src={wordmark} alt="Imbewu" className="mx-auto h-10 w-auto" />
        </Link>
        <h1 className="font-display text-4xl font-medium text-primary">
          {sent ? "Check your inbox." : "Reset your password."}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {sent ? (
            <>
              We sent a reset link to{" "}
              <span className="font-medium text-foreground">{email}</span>.
              Follow it to choose a new password.
            </>
          ) : (
            "Enter your email and we'll send you a link to set a new password."
          )}
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (sent && e.target.value !== lastSentEmailRef.current) setSent(false);
              }}
              placeholder="you@example.com"
              required
            />
          </div>
          {sent ? (
            <div
              className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4"
              role="status"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="space-y-1 text-sm">
                <p className="font-medium text-foreground">Reset link sent.</p>
                <p className="text-muted-foreground">
                  Didn't get it? Check your spam folder
                  {cooldown > 0 ? `, or resend in ${cooldown}s.` : " or resend below."}
                </p>
              </div>
            </div>
          ) : null}
          <Button
            type="submit"
            disabled={disabled}
            variant={sent ? "outline" : "default"}
            className={
              sent
                ? "h-11 w-full"
                : "h-11 w-full bg-primary text-primary-foreground shadow-[var(--shadow-luxe)] hover:bg-primary/90"
            }
          >
            {busy
              ? "Sending…"
              : cooldown > 0
                ? `Resend in ${cooldown}s`
                : sent
                  ? "Resend reset link"
                  : "Send reset link"}
            <Mail />
          </Button>
        </form>

        <Link
          to="/auth"
          className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
