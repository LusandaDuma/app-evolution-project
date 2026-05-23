# Imbewu — Agriculture Learning Platform

Imbewu is a full-stack agriculture learning platform for students, coordinators, independent growers, and administrators. It includes a marketing landing page, Supabase authentication, role-based dashboards, and production-ready deployment to **Vercel** via **GitHub**.

Built with **TanStack Start** (React 19 + SSR), **Vite 7**, **Tailwind CSS 4**, **shadcn/ui**, **Supabase**, and **Nitro** (Vercel adapter).

---

## Table of contents

1. [What was done (project setup summary)](#what-was-done-project-setup-summary)
2. [How to use this project (quick guide)](#how-to-use-this-project-quick-guide)
3. [Features](#features)
4. [Application routes](#application-routes)
5. [Tech stack](#tech-stack)
6. [Prerequisites](#prerequisites)
7. [Local development (step by step)](#local-development-step-by-step)
8. [Environment variables](#environment-variables)
9. [Supabase setup](#supabase-setup)
10. [Architecture and key modules](#architecture-and-key-modules)
11. [Error handling](#error-handling)
12. [Available npm scripts](#available-npm-scripts)
13. [Testing](#testing)
14. [GitHub Actions CI](#github-actions-ci)
15. [Deploy to Vercel via GitHub](#deploy-to-vercel-via-github)
16. [Deploy with Vercel CLI](#deploy-with-vercel-cli)
17. [Deploy to Cloudflare (optional)](#deploy-to-cloudflare-optional)
18. [Project structure](#project-structure)
19. [Files added or changed](#files-added-or-changed)
20. [Troubleshooting](#troubleshooting)
21. [License](#license)

---

## What was done (project setup summary)

This section documents every major change made to prepare the app for local use, testing, and Vercel deployment.

### 1. Fixed build-breaking issues

| Problem | Solution |
|---------|----------|
| Missing `imbewu-wordmark.png` asset (imported in 5 files) | Added `src/assets/imbewu-wordmark.svg` and updated all imports |
| App could crash on Supabase/network errors | Added try/catch, fallbacks, and centralized error messages |

### 2. Vercel deployment configuration

| Change | Purpose |
|--------|---------|
| Added **Nitro** with `preset: "vercel"` in `vite.config.ts` | TanStack Start requires Nitro for SSR on Vercel (avoids 404 on all routes) |
| Production build outputs `.vercel/output/` | Vercel auto-detects this; no custom `vercel.json` needed |
| `src/server.ts` wraps SSR with error handling | Shows a branded HTML page instead of a raw 500 JSON response |

### 3. Centralized error handling

| File | Purpose |
|------|---------|
| `src/lib/errors.ts` | Maps Supabase/auth errors to clear user-facing messages |
| `src/lib/password.ts` | Password strength rules and match validation |
| `src/lib/dashboard-routing.ts` | Role → dashboard URL logic (testable) |
| `src/lib/supabase-env.ts` | Validates env vars with actionable error text |
| `src/lib/ssr-errors.ts` | Detects swallowed SSR errors for `server.ts` |

All auth, dashboard, and admin flows now use `getErrorMessage()` and `logError()` instead of generic “Something went wrong” text.

### 4. Automated testing (Vitest)

| Test file | What it covers |
|-----------|----------------|
| `src/lib/errors.test.ts` | Auth error mapping, context fallbacks, env messages |
| `src/lib/password.test.ts` | Signup password rules, reset password matching |
| `src/lib/dashboard-routing.test.ts` | Admin / coordinator / grower / student routing |
| `src/lib/ssr-errors.test.ts` | SSR catastrophic error detection |
| `src/lib/supabase-env.test.ts` | Missing env variable errors |

**29 unit tests** — run with `npm run test`.

### 5. GitHub Actions CI

File: `.github/workflows/ci.yml`

On every push/PR to `main` or `master`:

1. `npm ci` — install dependencies
2. `npm run lint` — ESLint
3. `npm run typecheck` — TypeScript
4. `npm run test` — Vitest
5. `npm run build` — production build (with placeholder Supabase env for CI)

### 6. Security and repo hygiene

| Change | Purpose |
|--------|---------|
| `.env` added to `.gitignore` | Secrets are not committed to GitHub |
| `.env.example` added | Template for required variables |
| `.vercel/` added to `.gitignore` | Build output stays local |
| `README.md` (this file) | Full documentation |

### 7. Documentation and developer experience

- New npm scripts: `test`, `test:watch`, `typecheck`
- `vitest.config.ts` for test runner with `@/` path alias
- Resilient auth hook (`use-auth.tsx`) — role fetch failures default to `student` instead of crashing

---

## How to use this project (quick guide)

| Goal | Command / action |
|------|----------------|
| **Run locally** | `npm install` → copy `.env.example` to `.env` → `npm run dev` → open http://localhost:8080 |
| **Run tests** | `npm run test` |
| **Check types** | `npm run typecheck` |
| **Lint code** | `npm run lint` |
| **Build for production** | `npm run build` |
| **Preview production build** | `npm run preview` |
| **Push to GitHub** | `git push origin main` (never commit `.env`) |
| **Deploy to Vercel** | Import GitHub repo on Vercel → add env vars → deploy |
| **Sign in** | Go to `/auth` |
| **Reset password** | Go to `/forgot-password` → check email → `/reset-password` |
| **Access dashboard** | Sign in → auto-redirected by role |

---

## Features

| Area | Description | Route |
|------|-------------|-------|
| **Landing page** | Marketing site with courses, roles, and CTAs | `/` |
| **Sign in / Sign up** | Email/password auth with role selection on signup | `/auth` |
| **Forgot password** | Sends Supabase reset email with 60s resend cooldown | `/forgot-password` |
| **Reset password** | Set new password after email link | `/reset-password` |
| **Dashboard router** | Redirects user to role-specific dashboard | `/dashboard` |
| **Student dashboard** | Student view (placeholder) | `/dashboard/student` |
| **Coordinator dashboard** | Coordinator view (placeholder) | `/dashboard/coordinator` |
| **Grower dashboard** | Independent grower view (placeholder) | `/dashboard/grower` |
| **Admin dashboard** | Admin console with stats sidebar | `/dashboard/admin` |
| **SSR + error boundaries** | Server-rendered pages with 404/500 UI | All routes |

---

## Application routes

### Public routes (no login required)

| URL | Page | How to use |
|-----|------|------------|
| `/` | Landing page | Browse courses, click **Begin** or **Sign in** |
| `/auth` | Sign in / Sign up | Toggle between modes; signup requires strong password |
| `/forgot-password` | Password reset request | Enter email → receive reset link |
| `/reset-password` | New password form | Open link from email → enter matching passwords |

### Protected routes (login required)

| URL | Who can access | Behavior |
|-----|----------------|----------|
| `/dashboard` | Any signed-in user | Fetches roles from Supabase → redirects to correct dashboard |
| `/dashboard/student` | Students (default) | Shown when no role or `student` role |
| `/dashboard/coordinator` | Coordinators | Requires `coordinator` in `user_roles` |
| `/dashboard/grower` | Independent growers | Requires `independent` role |
| `/dashboard/admin` | Admins | Requires `admin` role; shows user/course stats |

### Role priority (when user has multiple roles)

Highest priority wins:

1. `admin` → `/dashboard/admin`
2. `coordinator` → `/dashboard/coordinator`
3. `independent` → `/dashboard/grower`
4. `student` (or none) → `/dashboard/student`

Logic lives in `src/lib/dashboard-routing.ts`.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router) |
| UI | React 19, Tailwind CSS 4, [shadcn/ui](https://ui.shadcn.com) |
| Backend / Auth | [Supabase](https://supabase.com) (PostgreSQL, Auth, RLS) |
| Build | Vite 7 |
| Vercel deployment | [Nitro](https://nitro.build) (`preset: "vercel"`) |
| Testing | [Vitest](https://vitest.dev) |
| CI | GitHub Actions |

---

## Prerequisites

- **Node.js** 20+ (22+ recommended; Vercel uses Node.js 24 runtime)
- **npm** 10+
- A **Supabase** project — [supabase.com](https://supabase.com)
- A **GitHub** account (for CI and Vercel Git integration)
- A **Vercel** account — [vercel.com](https://vercel.com) (free tier works)

---

## Local development (step by step)

### Step 1 — Clone and install

```bash
git clone <your-repo-url>
cd app-evolution-project
npm install
```

### Step 2 — Configure environment

```bash
cp .env.example .env
```

Edit `.env` with values from **Supabase → Project Settings → API**:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

> `VITE_*` variables are baked into the client bundle at **build time**. You must set them in Vercel before deploying.

### Step 3 — Run database migrations

Apply every SQL file in `supabase/migrations/` to your Supabase project, in filename order:

1. Open **Supabase Dashboard → SQL Editor**
2. Paste and run each migration file
3. Or use the Supabase CLI: `supabase db push`

### Step 4 — Configure Supabase Auth URLs

In **Authentication → URL Configuration**:

| Setting | Local value | Production value |
|---------|-------------|------------------|
| Site URL | `http://localhost:8080` | `https://your-app.vercel.app` |
| Redirect URLs | `http://localhost:8080/**` | `https://your-app.vercel.app/**` |

Password reset must allow: `https://your-app.vercel.app/reset-password`

### Step 5 — Start the dev server

```bash
npm run dev
```

Open the URL shown in the terminal (usually **http://localhost:8080**).

### Step 6 — Verify everything works

```bash
npm run test        # All 29 tests should pass
npm run typecheck   # No TypeScript errors
npm run build       # Should output .vercel/output/
```

### Step 7 — Preview production build locally

```bash
npm run build
npm run preview
```

---

## Environment variables

| Variable | Required | Used by | Description |
|----------|----------|---------|-------------|
| `VITE_SUPABASE_URL` | **Yes** | Browser + build | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | **Yes** | Browser + build | Supabase **anon** (public) key |
| `SUPABASE_URL` | **Yes** | Server (SSR) | Same URL as above |
| `SUPABASE_PUBLISHABLE_KEY` | **Yes** | Server (SSR) | Same anon key as above |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Server admin only | Bypasses RLS — **never expose to client** |

### Where to set them

| Environment | Where |
|-------------|-------|
| Local dev | `.env` file in project root |
| Vercel production | Vercel Dashboard → Project → Settings → Environment Variables |
| GitHub Actions CI | Already set as placeholders in `.github/workflows/ci.yml` |

### Security rules

- **Never** commit `.env` to GitHub (it is in `.gitignore`)
- **Never** put `SUPABASE_SERVICE_ROLE_KEY` in `VITE_*` variables
- Use the **anon** key for client and SSR user requests; service role only in trusted server code

Template: [`.env.example`](.env.example)

---

## Supabase setup

### 1. Create a project

Go to [supabase.com](https://supabase.com) → New project.

### 2. Run migrations

Files in `supabase/migrations/` create:

- `app_role` enum (`student`, `coordinator`, `admin`, `independent`)
- `profiles` table
- `user_roles` table with RLS
- `has_role()` security function
- Courses, enrolments, badges (in later migrations)

### 3. Enable Email auth

**Authentication → Providers → Email** → Enable.

### 4. Sign-up behavior

- Sign-up stores `display_name` and `role` in user metadata
- If no row exists in `user_roles`, the app defaults to **student**
- Admins can assign roles directly in the `user_roles` table

### 5. Password reset flow

1. User visits `/forgot-password`
2. Supabase sends email with link to `/reset-password`
3. User sets new password → redirected to `/dashboard`

---

## Architecture and key modules

```
Browser request
      │
      ▼
┌─────────────────┐     ┌──────────────────┐
│  TanStack Start │────▶│  src/server.ts   │  SSR error wrapper
│  (Vite + Nitro) │     └──────────────────┘
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│  File routes    │────▶│  use-auth hook   │  Session + roles
│  src/routes/    │     └──────────────────┘
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│ Supabase client │────▶│ supabase-env.ts  │  Env validation
│ integrations/   │     └──────────────────┘
└─────────────────┘
```

### `src/lib/errors.ts`

Central error utility. Use in any catch block:

```ts
import { getErrorMessage, logError } from "@/lib/errors";

try {
  await supabase.auth.signInWithPassword({ email, password });
} catch (err) {
  logError("SignIn", err);                        // logs to console (server/dev)
  toast.error(getErrorMessage(err, "auth"));      // user-friendly message
}
```

**Contexts:** `"auth"` | `"signup"` | `"forgot-password"` | `"reset-password"` | `"dashboard"` | `"admin"` | `"supabase"` | `"generic"`

### `src/lib/password.ts`

```ts
import { getPasswordRequirements, isPasswordValid, validatePasswordMatch } from "@/lib/password";

// Signup: all 5 rules must pass
const reqs = getPasswordRequirements(password);
const canSubmit = isPasswordValid(password);

// Reset: passwords must match and be ≥ 6 chars
const result = validatePasswordMatch(password, confirm);
if (!result.valid) toast.error(result.message);
```

**Signup rules:** 8+ chars, uppercase, lowercase, number, special character (`!@#$%^&*`)

### `src/lib/dashboard-routing.ts`

```ts
import { resolveDashboardRoute } from "@/lib/dashboard-routing";

const route = resolveDashboardRoute(["coordinator", "student"]);
// → "/dashboard/coordinator"
```

### `src/lib/supabase-env.ts`

Used by `client.ts`, `client.server.ts`, and `auth-middleware.ts`. Throws a clear error if env vars are missing:

```
Supabase is not configured. Missing: VITE_SUPABASE_URL / SUPABASE_URL.
Add them to your .env file (local) or Vercel project settings (production).
```

### `src/server.ts` + `src/start.ts`

- `server.ts` — Catches SSR crashes; returns branded HTML error page
- `start.ts` — TanStack Start middleware; catches unhandled server errors in routes

### `src/hooks/use-auth.tsx`

Provides to the whole app:

```ts
const { session, user, roles, loading, signOut } = useAuth();
```

- Loads session on mount
- Fetches roles from `user_roles` table
- Falls back to `["student"]` if role fetch fails (does not crash)

---

## Error handling

### User-facing messages (examples)

| Situation | Message shown |
|-----------|---------------|
| Wrong email/password | "Incorrect email or password. Please check your details and try again." |
| Email already registered | "An account with this email already exists. Sign in instead…" |
| Email not confirmed | "Please confirm your email before signing in…" |
| Too many login attempts | "Too many attempts. Please wait a few minutes and try again." |
| Expired reset link | "This password reset link has expired. Request a new link…" |
| Passwords don't match | "Passwords do not match. Enter the same password in both fields." |
| Missing Supabase env | Lists exact variable names + where to add them |
| Dashboard DB error | "Could not load your dashboard. Please refresh…" (falls back to student) |

### How errors flow

```
Supabase API error
       │
       ▼
getErrorMessage(err, "auth")   ← maps to friendly text
       │
       ├──▶ toast.error()      ← shown to user (client routes)
       └──▶ logError()         ← console.error with scope tag
```

### Adding errors to new features

1. Import `getErrorMessage` and `logError` from `@/lib/errors`
2. Pick the right context string
3. In `catch`, call `logError("MyFeature", err)` then show `getErrorMessage(err, "generic")`
4. Add a test in `src/lib/errors.test.ts` if mapping new Supabase codes

---

## Available npm scripts

| Command | What it does | When to use |
|---------|--------------|-------------|
| `npm run dev` | Starts Vite dev server with HMR | Daily development |
| `npm run build` | Production build → `.vercel/output/` | Before deploy or to verify build |
| `npm run build:dev` | Build in development mode | Debugging build issues |
| `npm run preview` | Serves the production build locally | Test production behavior |
| `npm run test` | Runs all Vitest tests once | Before pushing to GitHub |
| `npm run test:watch` | Runs tests in watch mode | While writing tests |
| `npm run typecheck` | `tsc --noEmit` — type errors only | Before pushing |
| `npm run lint` | ESLint on all source files | Before pushing |
| `npm run format` | Prettier — formats all files | Clean up code style |

### Recommended workflow before pushing

```bash
npm run test
npm run typecheck
npm run lint
npm run build
git add .
git commit -m "Your message"
git push origin main
```

---

## Testing

### Run tests

```bash
# Run all tests once
npm run test

# Watch mode (re-runs on file change)
npm run test:watch
```

### Test coverage

| File | Tests | Validates |
|------|-------|-----------|
| `errors.test.ts` | 10 | Auth error codes, context fallbacks, env messages |
| `password.test.ts` | 7 | Strength rules, match validation |
| `dashboard-routing.test.ts` | 5 | Role → URL mapping, priority order |
| `ssr-errors.test.ts` | 4 | h3 swallowed error detection |
| `supabase-env.test.ts` | 3 | Missing env throws clear errors |

**Total: 29 tests across 5 files**

### What tests do NOT cover (manual testing needed)

| Area | Why |
|------|-----|
| Live Supabase sign-in | Requires real credentials and network |
| Email delivery (reset link) | Requires Supabase email config |
| Vercel deployment | Test by deploying to Vercel preview |
| Admin stats queries | Requires populated database tables |

### Config

- Test runner config: [`vitest.config.ts`](vitest.config.ts)
- Tests live next to source: `src/lib/*.test.ts`

---

## GitHub Actions CI

**File:** [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

**Triggers:** Push or pull request to `main` or `master`

**Pipeline steps:**

```
checkout → setup Node 22 → npm ci → lint → typecheck → test → build
```

**Placeholder env vars** (for build only — not real Supabase):

```
VITE_SUPABASE_URL=https://placeholder.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...placeholder
SUPABASE_URL=https://placeholder.supabase.co
SUPABASE_PUBLISHABLE_KEY=eyJ...placeholder
```

To view CI results: **GitHub → Actions tab** on your repository.

---

## Deploy to Vercel via GitHub

### Overview

```
Your code (GitHub)  →  Vercel builds (npm run build)  →  Live site
                              │
                              └── Nitro outputs .vercel/output/
```

### Step 1 — Push to GitHub

```bash
git add .
git commit -m "Deploy Imbewu to Vercel"
git push origin main
```

Confirm `.env` is **not** in the commit:

```bash
git status   # .env should not appear
```

### Step 2 — Import project on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select your GitHub repo
4. Vercel auto-detects **TanStack Start**

### Step 3 — Configure build settings

| Setting | Value |
|---------|-------|
| Framework Preset | TanStack Start (auto) |
| Build Command | `npm run build` |
| Output Directory | **Leave empty** |
| Install Command | `npm ci` (default) |
| Node.js Version | 22.x or higher |

> **Do not** set Output Directory to `dist` — Nitro writes to `.vercel/output/` automatically.

### Step 4 — Add environment variables

In **Vercel → Project → Settings → Environment Variables**, add for **Production** and **Preview**:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your anon key |
| `SUPABASE_URL` | Same as `VITE_SUPABASE_URL` |
| `SUPABASE_PUBLISHABLE_KEY` | Same as anon key |

### Step 5 — Deploy

Click **Deploy**. First build takes 2–5 minutes.

Successful build log includes:

```
[nitro:vercel] i Using nodejs24.x runtime.
Generated .vercel/output/nitro.json
```

### Step 6 — Update Supabase for production URL

In Supabase **Authentication → URL Configuration**:

- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/**`

### Step 7 — Automatic deployments

Every `git push` to `main` triggers a new Vercel deployment automatically.

---

## Deploy with Vercel CLI

```bash
# Install CLI
npm i -g vercel

# Login and link project
vercel login
cd app-evolution-project
vercel link

# Pull env vars from Vercel to local .env (optional)
vercel env pull

# Deploy to production
vercel --prod
```

---

## Deploy to Cloudflare (optional)

This repo includes `wrangler.jsonc` for Cloudflare Workers (original Lovable template target).

To deploy to Cloudflare instead of Vercel:

1. Change Nitro preset in `vite.config.ts` from `"vercel"` to `"cloudflare"`
2. Follow [TanStack Start Cloudflare hosting docs](https://tanstack.com/start/latest/docs/framework/react/guide/hosting)

**Recommended for most users:** Vercel (already configured).

---

## Project structure

```
app-evolution-project/
│
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions: lint, test, build
│
├── src/
│   ├── assets/
│   │   └── imbewu-wordmark.svg    # Brand logo (SVG)
│   │
│   ├── components/
│   │   └── ui/                    # shadcn/ui components (Button, Input, etc.)
│   │
│   ├── hooks/
│   │   └── use-auth.tsx           # Auth context: session, roles, signOut
│   │
│   ├── integrations/supabase/
│   │   ├── client.ts              # Browser Supabase client (lazy init)
│   │   ├── client.server.ts       # Server admin client (service role)
│   │   ├── auth-middleware.ts     # Bearer token auth for server functions
│   │   └── types.ts               # Generated DB types
│   │
│   ├── lib/
│   │   ├── errors.ts              # User-facing error messages ★
│   │   ├── errors.test.ts
│   │   ├── password.ts            # Password validation ★
│   │   ├── password.test.ts
│   │   ├── dashboard-routing.ts   # Role → dashboard URL ★
│   │   ├── dashboard-routing.test.ts
│   │   ├── supabase-env.ts        # Env var validation ★
│   │   ├── supabase-env.test.ts
│   │   ├── ssr-errors.ts          # SSR error detection ★
│   │   ├── ssr-errors.test.ts
│   │   ├── error-capture.ts       # Captures errors for server.ts
│   │   ├── error-page.ts          # Branded HTML 500 page
│   │   └── utils.ts               # cn() Tailwind helper
│   │
│   ├── routes/                    # File-based routing (TanStack Router)
│   │   ├── __root.tsx             # Root layout, providers, 404/500 UI
│   │   ├── index.tsx              # Landing page (/)
│   │   ├── auth.tsx               # Sign in / sign up (/auth)
│   │   ├── forgot-password.tsx    # (/forgot-password)
│   │   ├── reset-password.tsx     # (/reset-password)
│   │   ├── dashboard.tsx          # Role redirect (/dashboard)
│   │   └── dashboard/
│   │       ├── admin.tsx          # Admin console
│   │       ├── student.tsx        # Student (placeholder)
│   │       ├── coordinator.tsx    # Coordinator (placeholder)
│   │       └── grower.tsx         # Grower (placeholder)
│   │
│   ├── server.ts                  # SSR entry + error wrapper (Vercel/CF)
│   ├── start.ts                   # TanStack Start middleware
│   ├── router.tsx                 # Router setup
│   └── styles.css                 # Global styles + Tailwind
│
├── supabase/
│   └── migrations/                # SQL schema (run in order)
│
├── .env.example                   # Env template (commit this)
├── .gitignore                     # Ignores .env, node_modules, .vercel
├── vite.config.ts                 # Vite + Nitro vercel preset ★
├── vitest.config.ts               # Test runner config ★
├── wrangler.jsonc                 # Cloudflare config (optional)
├── package.json                   # Dependencies and scripts
└── README.md                      # This file
```

★ = Added or significantly changed during project setup

---

## Files added or changed

### New files

| File | Purpose |
|------|---------|
| `README.md` | This documentation |
| `.env.example` | Environment variable template |
| `.github/workflows/ci.yml` | GitHub Actions CI pipeline |
| `vitest.config.ts` | Vitest configuration |
| `src/assets/imbewu-wordmark.svg` | Brand logo asset |
| `src/lib/errors.ts` | Centralized error messages |
| `src/lib/password.ts` | Password validation helpers |
| `src/lib/dashboard-routing.ts` | Role-based dashboard routing |
| `src/lib/supabase-env.ts` | Environment variable validation |
| `src/lib/ssr-errors.ts` | SSR error body detection |
| `src/lib/*.test.ts` (5 files) | Unit tests (29 tests total) |

### Modified files

| File | Change |
|------|--------|
| `vite.config.ts` | Added Nitro `preset: "vercel"` |
| `package.json` | Added `test`, `typecheck`, `nitro`, `vitest` |
| `.gitignore` | Added `.env`, `.vercel` |
| `src/integrations/supabase/client.ts` | Uses `supabase-env.ts` |
| `src/integrations/supabase/client.server.ts` | Uses `supabase-env.ts` |
| `src/integrations/supabase/auth-middleware.ts` | Uses `supabase-env.ts` |
| `src/server.ts` | Uses `ssr-errors.ts` module |
| `src/routes/auth.tsx` | Clear errors + password lib |
| `src/routes/forgot-password.tsx` | Clear errors |
| `src/routes/reset-password.tsx` | Clear errors + password match |
| `src/routes/dashboard.tsx` | Routing lib + error handling |
| `src/routes/dashboard/admin.tsx` | Error handling for stats |
| `src/hooks/use-auth.tsx` | Resilient role/session loading |
| `src/routes/index.tsx` (and 4 others) | Wordmark import `.png` → `.svg` |

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Supabase is not configured. Missing: …` | `.env` missing or incomplete | Copy `.env.example` → `.env`, fill all 4 required vars |
| 404 on every route after Vercel deploy | Nitro preset missing | Confirm `nitro({ preset: "vercel" })` in `vite.config.ts`; redeploy without cache |
| Blank white page on Vercel | `VITE_*` env vars not set | Add all 4 vars in Vercel → redeploy |
| `Incorrect email or password` | Wrong credentials or unconfirmed email | Check Supabase Auth users; confirm email if required |
| Reset email not received | Supabase email not configured | Enable Email provider; check spam; verify redirect URL |
| Reset link doesn't work | Redirect URL not in Supabase allowlist | Add `https://your-app.vercel.app/reset-password` |
| Always lands on student dashboard | No `user_roles` row | Normal for new users; insert role in Supabase |
| Admin stats show 0 | Tables empty or RLS blocking | Run migrations; check Supabase logs |
| `npm install` EPERM (Windows) | File locks / antivirus | Close IDE, delete `node_modules`, run as Administrator |
| CI fails on `npm ci` | `package-lock.json` out of sync | Run `npm install` locally, commit `package-lock.json` |
| Build succeeds but auth fails | Placeholder CI keys used in production | Set real Supabase keys in Vercel env vars |

### Verify a healthy deployment

1. Build log shows `[nitro:vercel]` and `Generated .vercel/output/nitro.json`
2. Homepage loads at your Vercel URL
3. `/auth` page loads without console errors about Supabase
4. Sign-in works with a test account
5. GitHub Actions CI shows green checkmark

### Get help

1. Check browser **DevTools → Console** for `[Auth]`, `[SignIn]`, etc. log tags
2. Check **Supabase Dashboard → Logs** for API errors
3. Check **Vercel → Deployments → Build Logs** for build failures
4. Run `npm run test` locally to confirm core logic passes

---

## License

Private project — all rights reserved unless otherwise specified by the repository owner.
