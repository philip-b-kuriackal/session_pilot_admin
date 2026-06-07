# SessionPilot Ops

A cloud-based **restaurant operations management platform** — digitize SOPs, schedule and assign
recurring tasks, track attendance and timesheets, manage multiple locations, and run a crisis
broadcast system. Built with **SvelteKit (Svelte 5) + Supabase** (Postgres, Auth, Storage, RLS).

One codebase, two surfaces:

| Surface | URL | Who | Look & feel |
|---|---|---|---|
| **Employee app** | `/` | Employees, shift & restaurant managers | Mobile-frame app (max 480px), "Proxie" social-style UI |
| **Admin portal** | `/admin` | Super Admin, Org Admin, Restaurant/Shift Manager | Desktop web portal, minimal lime design system, Apple system font |
| **Public display** | `/display/<key>` | Anyone (no login) | Full-screen attendance QR kiosk for external screens |

---

## Quick start

```sh
# 1. install
npm install

# 2. configure (see "Environment" below)
cp .env.example .env          # then fill in your Supabase keys

# 3. provision the database (Supabase SQL Editor or psql), in order:
#    supabase/schema.sql   → all tables, enums, functions, RLS, storage buckets
#    supabase/seed.sql     → PK Foods Group demo data (locations, SOPs, tasks…)

# 4. create the demo auth users + sample shifts/posts
node scripts/setup-demo.mjs

# 5. run
npm run dev                   # http://localhost:5173
npm run dev -- --host         # also expose on your LAN (phone testing)
```

> **Phone / LAN testing:** `--host` serves on your machine's IP (e.g. `http://192.168.0.187:5173`).
> Auth cookies are only marked `Secure` over HTTPS, so plain-HTTP LAN login works. The **in-app QR
> camera scanner** needs a secure context (HTTPS or `localhost`); over plain-HTTP LAN, use the phone's
> native camera app to scan the attendance QR (it still checks you in).

---

## Environment

Copy `.env.example` → `.env` and fill in from **Supabase → Project Settings → API**:

```sh
# Public — safe to ship to the browser (used by @supabase/ssr client)
PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<your anon / publishable key>

# Server-only — NEVER expose to the browser.
# Used to create auth users from the admin portal, the public attendance display
# reads, and scripts/setup-demo.mjs.
SUPABASE_SERVICE_ROLE_KEY=<your service_role key>
```

| Variable | Where it's used | Public? |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | SSR + browser Supabase client | ✅ shipped to browser |
| `PUBLIC_SUPABASE_ANON_KEY` | SSR + browser Supabase client (RLS enforced) | ✅ shipped to browser |
| `SUPABASE_SERVICE_ROLE_KEY` | `src/lib/server/admin.ts` (user creation, public display lookups), demo script | 🔒 server only |

---

## Demo credentials

All accounts use password **`Demo1234!`** (created by `scripts/setup-demo.mjs`):

| Email | Role | Restaurant | Lands on |
|---|---|---|---|
| `admin@sessionpilot.demo` | Org Admin | — (all) | `/admin` |
| `manager@sessionpilot.demo` | Restaurant Manager | Little Asia | `/admin` |
| `shift@sessionpilot.demo` | Shift Manager | Little Asia | `/admin` |
| `employee@sessionpilot.demo` | Employee (Kitchen Staff) | Little Asia | `/` (mobile app) |
| `employee2@sessionpilot.demo` | Employee (Kitchen Staff) | Svensk24 | `/` (mobile app) |

The seed also creates the **PK Foods Group** organization with three restaurants — **Little Asia**,
**Svensk24**, **Östra Street Food** — departments, job roles, responsibilities, SOPs, recurring task
templates, opening hours, and a month of historical time entries for timesheet demos.

> View the employee app in a narrow window / device emulation — it's mobile-only by design.

---

## Features

### Employee app (`/`)
- **Feed** — social posts with reactions, comments, stories, highlights; create posts (with media)
- **⏱ Time clock** — Check in → live timer → **Pause/Resume** (breaks) → Check out, all timestamped;
  themed check-out confirmation popup
- **🚨 Urgent broadcasts** — crisis posts take over every employee's screen full-screen until they
  **swipe up to dismiss** (per-user, auto-expire after 48h)
- **Schedule** — day-by-day view of **work shifts + tasks due** + **Events** (join/leave)
- **Task execution** — open a task → follow SOP steps → tick checklist → upload **photo/note evidence**
  → submit (auto-completes if approval not required, else goes to the approvals queue)
- **Notifications**, **Directory** (real org members), **Hub** (handbooks/academy), **You** (profile, sign out)
- **Dynamic branding** — the app shows the **restaurant name the admin assigned** the user to
- **Chat** — hidden until an admin enables it per location

### Admin portal (`/admin`)
- **Dashboard** — today's tasks, compliance per location, recent activity
- **🟢 Live** — date-navigable, **event-by-event** operations log (what · when · who), **deviation
  tracking** (scheduled deadline vs actual finish: on-time / late / overdue / missed), and real-time
  "who's on shift now"
- **Approvals** — review submitted tasks (checklist + evidence) → approve / reject with reason
- **Tasks** — minimal list + clean creator: recurrence (daily/weekly/monthly/custom), checklist
  builder, assignment (everyone / by role / specific people), **deadline**, evidence requirement,
  and a **"requires manager approval" toggle**
- **SOP builder** — SOPs with ordered steps + attachments (**direct photo upload** or URL/PDF/video)
- **Schedule** — visual week grid + a **day-planner modal**: a role × time **Gantt timeline** where you
  drag/resize/reassign shift blocks, see **partial-coverage gaps** vs opening hours, copy day→day,
  duplicate week→week, and manage holidays (per-location or all) — holidays suppress task generation
- **Locations** — card grid → **tabbed location hub** (Overview · Opening hours · Team · Roles & setup)
  with a connected accordion flow: Departments → Responsibilities → Job roles → Required roles
- **Users** — create employees (Supabase Auth) with role, restaurant, department, job role, **contract
  type + hourly rate + monthly contract hours**, address, **paygrade**, salary, employment form, etc.;
  one-click **📄 Offer letter**
- **📄 Offer letters** — the Swedish *Anställningsbevis* builder, prefilled from the employee + a
  **company dropdown** (multiple legal entities), fully editable, **export to PDF** (A4 print)
- **📊 Timesheets** — monthly hours per employee with breaks, **manual adjustments** (negotiated
  corrections), **overtime** vs contract hours, **estimated pay**; per-employee **Excel (.xlsx) export**
  with employee details + day-by-day start/end/breaks/total
- **📷 Attendance code** — rotating, signed **QR check-in** (anti-spoofing): a live QR (refreshes every
  5s) + a **public shareable link** (`/display/<key>`) for external screens. Enforce per location in
  Settings → staff must scan to clock in
- **Reports**, **immutable Audit log**, **Settings** (org, per-location chat & QR toggles, companies),
  Departments / Job roles / Responsibilities (also universal-vs-restaurant scoped)

---

## Database (`supabase/schema.sql`)

`schema.sql` is the **single canonical setup file** — run it once on a fresh project and it builds
everything: enums, ~30 tables, helper functions, RLS policies for all five roles, and storage buckets.
Its header documents the 13 sections in dependency order. Highlights:

- **Org tree** — `organizations → brands → locations` (+ opening hours, feature flags, attendance secrets)
- **`profiles`** — 1:1 with `auth.users` (auto-created via trigger), carries role, assignment, contract
  & employment-letter fields
- **Tasks** — `task_templates` (recurrence config in JSONB) → `task_instances` (one per due date,
  generated by the `generate_task_instances(date)` function, which **skips holidays**) →
  `item_completions`, `evidence`, `approvals`
- **Time tracking** — `time_entries` + `time_entry_breaks` + `time_adjustments`
- **Security** — RLS on every table; helper fns `app.me_org()`, `app.me_role()`, `app.is_manager()`;
  `audit_logs` is insert-only (no update/delete grants — immutable)

**Storage buckets:** `evidence` (private, signed URLs) · `avatars` · `attachments` · `posts` (public).

> `supabase/migrations_002_scheduling.sql` and `migrations_003_time_tracking.sql` are the historical
> incremental migrations (useful for upgrading an already-running older instance). For a fresh setup
> you only need `schema.sql` — it already includes them.

### Applying with `psql`

```sh
# Supabase pooler connection string from Project Settings → Database
PGPASSWORD='<db-password>' psql \
  -h aws-1-<region>.pooler.supabase.com -p 5432 -U postgres.<project-ref> -d postgres \
  -f supabase/schema.sql

# then seed + users
PGPASSWORD='<db-password>' psql -h … -f supabase/seed.sql
node scripts/setup-demo.mjs
```

---

## Project structure

```
supabase/
  schema.sql              # ← single canonical DB setup (tables, RLS, functions, buckets)
  seed.sql                # PK Foods Group demo data
  migrations_00*.sql      # historical incremental migrations (already in schema.sql)
scripts/
  setup-demo.mjs          # creates demo auth users + sample shifts/posts (service role)
docs/
  onboarding-tool-reference.html   # original HTML offer-letter tool the builder mirrors
src/
  hooks.server.ts         # Supabase SSR client, session, RBAC route guards, cookie security
  lib/
    types.ts              # shared row types + helpers (fullName, entryNetMinutes, brandNameFor…)
    admin.css             # admin design system (tokens, components)
    server/
      admin.ts            # service-role client + audit() helper
      attendance.ts       # rotating HMAC attendance-token sign/verify
    components/           # TimeClock, QrScanner, UrgentOverlay, Post, BottomNav, Header…
  routes/
    login/                # email/password sign-in (+ logout action)
    (app)/                # employee mobile app (feed, schedule, tasks, hub, you, directory,
                          #   notifications, chat*, checkin)
    display/[key]/        # public no-login attendance QR screen
    admin/                # dashboard, live, approvals, tasks, sops, schedule, locations,
                          #   users, timesheets, attendance-code, reports, audit, settings…
```

\* Chat is hidden unless enabled per location.

---

## Tech & scripts

- **SvelteKit 2 / Svelte 5** (runes), **TypeScript**, **Vite**
- **@supabase/ssr** for cookie-based SSR auth; RLS-scoped queries via `locals.supabase`
- **exceljs** (timesheet export), **qrcode** + **jsqr** (attendance QR), **jspdf**-free PDF via print

```sh
npm run dev          # dev server
npm run build        # production build
npm run preview      # preview the build
npm run check        # svelte-check (type checking)
```

---

## Notes

- Built against the SRS Phase-1 MVP scope (multi-location, RBAC, SOPs, task scheduling/assignment,
  mobile execution, photo evidence, approvals, notifications, dashboards, reporting, audit logs).
- Employee app keeps its mobile "Proxie" look; the admin portal uses a separate minimal lime design
  system with the Apple system font.
- Auth is real Supabase Auth (JWT + RLS); every mutation that matters is written to the immutable
  audit log.
