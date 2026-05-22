import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Leaf, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import wordmark from "@/assets/imbewu-wordmark.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Sign in — Imbewu" }],
  }),
  component: AuthPage,
});

type SignupRole = "student" | "coordinator" | "independent";

const roleOptions: { value: SignupRole; label: string; hint: string }[] = [
  { value: "student", label: "Student", hint: "Learn through structured courses" },
  { value: "coordinator", label: "Coordinator", hint: "Lead classes and learners" },
  { value: "independent", label: "Independent grower", hint: "Cultivate at your own pace" },
];

function AuthPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<SignupRole>("student");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const passwordRequirements = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*]/.test(password),
  };

  const allRequirementsMet = Object.values(passwordRequirements).every(Boolean);
  const isSignupDisabled = mode === "signup" && !allRequirementsMet;

  useEffect(() => {
    if (session) navigate({ to: "/dashboard" });
  }, [session, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName, role },
          },
        });
        if (signupError) throw signupError;

        toast.success("Welcome to Imbewu!");
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          console.error("Sign in error:", error);
          if (error.message.includes("Invalid login credentials")) {
            throw new Error("Incorrect email or password. Please try again.");
          }
          throw error;
        }
        toast.success("Welcome back.");
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Brand panel */}
      <div
        className="relative hidden flex-col justify-between p-12 text-cream md:flex"
        style={{ background: "var(--gradient-emerald)" }}
      >
        <Link to="/" className="inline-flex items-center gap-2 text-cream/90">
          <img src={wordmark} alt="Imbewu" className="h-9 w-auto brightness-0 invert" />
        </Link>
        <div>
          <Leaf className="h-10 w-10 text-gold" />
          <h2 className="mt-6 font-display text-5xl font-medium leading-tight">
            The seed is planted.
            <br />
            <span className="italic text-gold">Now grow.</span>
          </h2>
          <p className="mt-6 max-w-md text-cream/75">
            Join thousands of learners cultivating their craft on Imbewu — South Africa's
            refined agriculture academy.
          </p>
        </div>
        <p className="text-xs uppercase tracking-[0.2em] text-cream/50">
          © {new Date().getFullYear()} Imbewu
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background px-6 py-16">
        <div className="w-full max-w-sm">
          <Link to="/" className="md:hidden">
            <img src={wordmark} alt="Imbewu" className="mx-auto h-10 w-auto" />
          </Link>
          <h1 className="mt-8 font-display text-4xl font-medium text-primary md:mt-0">
            {mode === "signin" ? "Welcome back." : "Create your account."}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Continue cultivating your craft."
              : "Begin your journey with Imbewu."}
          </p>

          {mode === "signin" ? (
            <form onSubmit={handleSubmit} className="mt-10 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={busy}
                className="h-11 w-full bg-primary text-primary-foreground shadow-[var(--shadow-luxe)] hover:bg-primary/90"
              >
                {busy ? "Please wait…" : "Sign in"}
                <ArrowRight />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="mt-10 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Display name</Label>
                <Input
                  id="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>I am joining as</Label>
                <div className="grid gap-2">
                  {roleOptions.map((opt) => {
                    const active = role === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRole(opt.value)}
                        className={`rounded-lg border px-4 py-3 text-left transition-all ${
                          active
                            ? "border-primary bg-primary/5 shadow-[var(--shadow-soft)]"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <p className="font-medium text-foreground">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.hint}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="mt-4 space-y-2 rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-xs font-medium text-muted-foreground">Password requirements:</p>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center gap-2">
                      <span
                        className={`font-semibold ${
                          passwordRequirements.minLength ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {passwordRequirements.minLength ? "✓" : "✗"}
                      </span>
                      <span className="text-foreground">At least 8 characters</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span
                        className={`font-semibold ${
                          passwordRequirements.uppercase ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {passwordRequirements.uppercase ? "✓" : "✗"}
                      </span>
                      <span className="text-foreground">One uppercase letter</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span
                        className={`font-semibold ${
                          passwordRequirements.lowercase ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {passwordRequirements.lowercase ? "✓" : "✗"}
                      </span>
                      <span className="text-foreground">One lowercase letter</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span
                        className={`font-semibold ${
                          passwordRequirements.number ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {passwordRequirements.number ? "✓" : "✗"}
                      </span>
                      <span className="text-foreground">One number</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span
                        className={`font-semibold ${
                          passwordRequirements.special ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {passwordRequirements.special ? "✓" : "✗"}
                      </span>
                      <span className="text-foreground">One special character (!@#$%^&*)</span>
                    </li>
                  </ul>
                </div>
              </div>

              <Button
                type="submit"
                disabled={busy || isSignupDisabled}
                className="h-11 w-full bg-primary text-primary-foreground shadow-[var(--shadow-luxe)] hover:bg-primary/90"
              >
                {busy ? "Please wait…" : "Create account"}
                <ArrowRight />
              </Button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New to Imbewu?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setEmail("");
                setPassword("");
              }}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
