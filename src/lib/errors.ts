/**
 * Maps unknown errors to user-facing messages. Server logs keep the original detail.
 */

export type ErrorContext =
  | "auth"
  | "signup"
  | "forgot-password"
  | "reset-password"
  | "dashboard"
  | "admin"
  | "supabase"
  | "generic";

type SupabaseLikeError = {
  message?: string;
  status?: number;
  code?: string;
  name?: string;
};

const AUTH_MESSAGE_MAP: Record<string, string> = {
  invalid_credentials:
    "Incorrect email or password. Please check your details and try again.",
  invalid_login_credentials:
    "Incorrect email or password. Please check your details and try again.",
  user_already_registered:
    "An account with this email already exists. Sign in instead or use a different email.",
  email_exists:
    "An account with this email already exists. Sign in instead or use a different email.",
  email_not_confirmed:
    "Please confirm your email before signing in. Check your inbox for the confirmation link.",
  signup_disabled:
    "New sign-ups are temporarily disabled. Please try again later or contact support.",
  weak_password:
    "Password is too weak. Use at least 8 characters with upper and lower case, a number, and a special character.",
  same_password:
    "Your new password must be different from your current password.",
  session_not_found:
    "Your session has expired. Please sign in again.",
  refresh_token_not_found:
    "Your session has expired. Please sign in again.",
  flow_state_expired:
    "This password reset link has expired. Request a new link from the forgot-password page.",
  otp_expired:
    "This password reset link has expired. Request a new link from the forgot-password page.",
};

function asSupabaseError(error: unknown): SupabaseLikeError | null {
  if (!error || typeof error !== "object") return null;
  return error as SupabaseLikeError;
}

function matchAuthMessage(message: string): string | undefined {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
    return AUTH_MESSAGE_MAP.invalid_login_credentials;
  }
  if (lower.includes("email not confirmed")) {
    return AUTH_MESSAGE_MAP.email_not_confirmed;
  }
  if (lower.includes("user already registered") || lower.includes("already been registered")) {
    return AUTH_MESSAGE_MAP.user_already_registered;
  }
  if (lower.includes("password should be at least") || lower.includes("weak password")) {
    return AUTH_MESSAGE_MAP.weak_password;
  }
  if (lower.includes("jwt expired") || lower.includes("token has expired")) {
    return AUTH_MESSAGE_MAP.flow_state_expired;
  }
  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  if (lower.includes("network") || lower.includes("fetch failed")) {
    return "Network error. Check your connection and try again.";
  }

  return undefined;
}

export function mapSupabaseAuthError(error: unknown): string {
  const supa = asSupabaseError(error);
  if (!supa) return "Authentication failed. Please try again.";

  if (supa.code && AUTH_MESSAGE_MAP[supa.code]) {
    return AUTH_MESSAGE_MAP[supa.code];
  }

  if (supa.message) {
    const mapped = matchAuthMessage(supa.message);
    if (mapped) return mapped;
    return supa.message;
  }

  return "Authentication failed. Please try again.";
}

export function missingSupabaseEnvMessage(missing: string[]): string {
  return `Supabase is not configured. Missing: ${missing.join(", ")}. Add them to your .env file (local) or Vercel project settings (production). See .env.example.`;
}

const CONTEXT_FALLBACK: Record<ErrorContext, string> = {
  auth: "Sign in failed. Please check your email and password, then try again.",
  signup: "Could not create your account. Please review your details and try again.",
  "forgot-password":
    "Could not send the reset email. Check the address is correct and try again.",
  "reset-password":
    "Could not update your password. Your reset link may have expired — request a new one.",
  dashboard: "Could not load your dashboard. Please refresh the page or sign in again.",
  admin: "Could not load admin data. You may not have permission or the database is unavailable.",
  supabase: "Database connection failed. Please try again in a moment.",
  generic: "Something went wrong. Please try again.",
};

export function getErrorMessage(error: unknown, context: ErrorContext = "generic"): string {
  if (typeof error === "string" && error.trim()) return error.trim();

  if (error instanceof Error && error.message.trim()) {
    const authContexts: ErrorContext[] = ["auth", "signup", "forgot-password", "reset-password"];
    if (authContexts.includes(context)) {
      const mapped = matchAuthMessage(error.message);
      if (mapped) return mapped;
    }
    return error.message;
  }

  const supa = asSupabaseError(error);
  if (supa?.message) {
    const authContexts: ErrorContext[] = ["auth", "signup", "forgot-password", "reset-password"];
    if (authContexts.includes(context)) {
      return mapSupabaseAuthError(error);
    }
    const mapped = matchAuthMessage(supa.message);
    if (mapped) return mapped;
    return supa.message;
  }

  return CONTEXT_FALLBACK[context];
}

export function logError(scope: string, error: unknown): void {
  console.error(`[${scope}]`, error);
}
