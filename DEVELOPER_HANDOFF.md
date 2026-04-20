# Developer Hand-off — Atelier Wealth Portfolio Tool

Welcome. This document is everything you need to take the prototype, host it
on the company domain, and stand up real cloud persistence — while the
business team keeps editing the UI in **Lovable**.

If you read nothing else, read **§3 Workflow** and **§5 The four seam files**.

---

## 1. What this app is

A client-side React app for modelling property investment scenarios
(PPOR + investment portfolio + proposed purchases + sell-down planning).
Three user roles:

| Role     | Lands on   | Can do                                                              |
| -------- | ---------- | ------------------------------------------------------------------- |
| Client   | `/`        | Edit their own scenarios on the dashboard                           |
| Adviser  | `/adviser` | Manage clients & agents, build scenarios on behalf of clients, share with agents |
| Agent    | `/agent`   | Read-only view of scenarios explicitly shared with them             |

Today the app is a **UI-only prototype**: every piece of user data lives in
the browser's `localStorage`. Clearing browser data wipes everything. Your
job is to move all of it to a real hosted backend on our domain.

---

## 2. Tech specs

| Concern        | Choice                                                       |
| -------------- | ------------------------------------------------------------ |
| Framework      | React 18 + Vite 5 + TypeScript 5                             |
| Styling        | Tailwind CSS v3, shadcn/ui (Radix primitives), Inter font    |
| Routing        | react-router-dom v6                                          |
| Data fetching  | `@tanstack/react-query` (already installed)                  |
| Charts         | Recharts                                                     |
| Forms / valid. | react-hook-form + zod                                        |
| Tests          | Vitest + Testing Library                                     |
| Build output   | Plain static assets in `dist/` (`npm run build`)             |
| Node           | 18+                                                          |
| Package mgr    | npm (lockfile in repo). Bun also works locally.              |

There is **no backend code** in this repo. No API routes, no SSR, nothing
to "deploy" beyond static assets.

### Brand / design system
- Primary colour: orange `hsl(20, 60%, 52%)`
- All colours are HSL semantic tokens defined in `src/index.css` /
  `tailwind.config.ts`. Don't hardcode hex values in components.
- Brand name: **Atelier Wealth**.

---

## 3. Workflow — Lovable ↔ GitHub ↔ you

GitHub is already connected to the Lovable project. Here's the loop:

```
[ Business team edits in Lovable ]
            │  auto-commits to the connected GitHub repo
            ▼
[ GitHub repo (source of truth) ]  ←──── you push backend integration changes
            │
            ▼
[ Your CI/CD ]  →  builds `dist/`  →  deploys to app.yourcompany.com
                                              ↕  (same parent domain)
                              [ Your API at api.yourcompany.com ]
                                              ↕
                                       [ Postgres ]
```

### Rules of the road

1. **Lovable pushes to a branch you control.** Recommended setup:
   - Lovable writes to `main` (or `lovable-main`).
   - You work on `production` and merge `main` into it after review/test.
   - Production deploys only from `production`.
2. **Don't edit UI components in your fork** unless you absolutely must.
   Anything you change there can be overwritten the next time the business
   team makes a UI tweak in Lovable.
3. **You own four files** (see §5). Lovable is told not to rewrite the
   internals of these — it only adds new functions to them when new data
   needs persisting. Your `apiFetch()` wiring stays intact.
4. **Publishing from Lovable**: the business team clicking "Publish" in
   Lovable updates the Lovable preview URL only. **Your production
   deployment is driven by your CI**, not by Lovable's publish button.
   This is a feature, not a bug — it gives you a review gate.

### A typical change cycle

1. Business team adds, say, a "client phone number" field in Lovable.
2. Lovable auto-commits to `main`. CI runs lint + build on the PR.
3. You review the diff. 99% of the time it's just UI / TS-type changes.
4. If a new persistent field is involved, you do one of:
   - **Inside `state_json`** (scenario internals): nothing to do.
   - **New top-level column on `clients`/`agents`/`scenarios`**: one
     migration (`alter table ... add column phone text;`).
5. Merge to `production`. CI deploys.

---

## 4. What's currently in localStorage (must move to the cloud)

| Key                                                                                                                                            | Purpose                                  | Cloud destination                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------- |
| `auth-role`, `auth-user`                                                                                                                       | Mock login session                       | Real auth provider session (httpOnly cookie)   |
| `saved-scenarios`                                                                                                                              | All saved scenarios + sharing metadata   | `scenarios` + `scenario_shares` tables         |
| `clients`                                                                                                                                      | Adviser's client directory               | `clients` table                                |
| `agents`                                                                                                                                       | Adviser's agent directory                | `agents` table                                 |
| `portfolio-ppor`, `portfolio-properties`, `portfolio-future-properties`, `client-name`, `global-interest-rate`, `target-month`, `target-year`, `growth-rate`, `ppor-suburb`, `ppor-starting-balance` | The live working scenario being edited   | One row in `scenarios` (`state_json`)          |

### What can stay in localStorage (safe to wipe)

Pure UI flags. Losing them only re-shows a toast/dialog:

- `disclaimer-shown`
- `welcome-dismissed`
- `tip-shown` and other onboarding flags

This safe-list is exported from `src/lib/workingScenario.ts` as
`UI_ONLY_LOCALSTORAGE_KEYS`.

---

## 5. The four seam files (your only edit targets)

Every read/write of user data flows through these four modules. Components
never touch storage directly. To migrate to the cloud you rewrite the
**internals** of these files — the **public function signatures** must stay
identical, so no component code changes.

| File                          | Responsibility                                             |
| ----------------------------- | ---------------------------------------------------------- |
| `src/lib/auth.ts`             | Current user + role, login session, logout                 |
| `src/lib/clients.ts`          | Adviser's clients & agents directories (CRUD)              |
| `src/lib/scenarioManager.ts`  | Saved scenarios + sharing metadata                         |
| `src/lib/workingScenario.ts`  | The live in-progress dashboard state the user is editing   |

There's also a placeholder `src/lib/api.ts` — wire your base URL +
`fetch()` helper there once and reuse it across all four seams.

Search the repo for `TODO(backend)` to find every swap point. Each one has
a comment listing the exact endpoint it should call.

---

## 6. Suggested API

```text
# Auth
POST   /auth/login              { email, password } → sets httpOnly session cookie
POST   /auth/logout
GET    /auth/me                 → { id, name, email, role }

# Clients (adviser only)
GET    /clients
POST   /clients                 { name, email }
PATCH  /clients/:id             { name?, email? }
DELETE /clients/:id

# Agents (adviser only)
GET    /agents
POST   /agents                  { name, email, agency? }
PATCH  /agents/:id
DELETE /agents/:id

# Scenarios
GET    /scenarios               → list visible to the caller
GET    /scenarios/:id           → metadata + state_json (if authorised)
POST   /scenarios               { name, type, clientId?, state }
PATCH  /scenarios/:id           { name?, state?, clientId?, type? }
DELETE /scenarios/:id
POST   /scenarios/:id/shares    { agentIds: string[] }   (adviser only)

# The live working scenario (the dashboard the user is editing right now)
GET    /scenarios/current       → ScenarioState
PATCH  /scenarios/current       → ScenarioState
```

### Authorisation rules

| Caller role | Can see                                                                          |
| ----------- | -------------------------------------------------------------------------------- |
| client      | their own scenarios only (`owner_id = me`)                                       |
| adviser     | scenarios they own + scenarios where `client_id` belongs to one of their clients |
| agent       | scenarios where `(scenario_id, me)` exists in `scenario_shares` — **read-only**  |

> The frontend uses `?readonly=1` as a UI hint to disable inputs for
> agents. **Do not trust this flag server-side.** Enforce read-only by
> rejecting any write where the caller is an agent.

---

## 7. Suggested database schema (Postgres)

```sql
create table profiles (
  id uuid primary key,                       -- = auth user id
  name text not null,
  email text not null unique,
  created_at timestamptz default now()
);

-- Roles in their own table — never on profiles. Avoids privilege-escalation
-- bugs and lets a single user hold multiple roles in future.
create type app_role as enum ('client', 'adviser', 'agent');
create table user_roles (
  user_id uuid references profiles(id) on delete cascade,
  role    app_role not null,
  primary key (user_id, role)
);

create table clients (
  id          uuid primary key default gen_random_uuid(),
  adviser_id  uuid references profiles(id) on delete set null,
  name        text not null,
  email       text not null,
  created_at  timestamptz default now()
);

create table agents (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  agency      text,
  created_at  timestamptz default now()
);

create table client_agents (
  client_id uuid references clients(id) on delete cascade,
  agent_id  uuid references agents(id)  on delete cascade,
  primary key (client_id, agent_id)
);

create table scenarios (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        text not null check (type in ('individual','smsf')),
  owner_id    uuid references profiles(id) on delete set null,
  client_id   uuid references clients(id)  on delete set null,
  state_json  jsonb not null,                -- entire ScenarioState blob
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table scenario_shares (
  scenario_id uuid references scenarios(id) on delete cascade,
  agent_id    uuid references agents(id)    on delete cascade,
  granted_by  uuid references profiles(id),
  granted_at  timestamptz default now(),
  primary key (scenario_id, agent_id)
);
```

### Why `state_json` is one big JSON column

The "scenario state" is a deeply nested object (PPOR, investment
properties, proposed purchases, loan splits, sale costs, CGT settings,
sell-down plans…) that evolves often as the business team adds UI
features. Storing it as a single `jsonb` column means:

- **Adding new fields in the UI requires zero database migrations.**
- You don't get pulled into every product change.
- Only top-level metadata (name, type, owner, client, sharing) lives in
  real columns, because that's what you query and authorise on.

---

## 8. Hosting & environment

The frontend reads its API base URL from a Vite env var:

```bash
# .env (or your platform's secrets store)
VITE_API_URL=https://api.yourcompany.com
```

After setting it, wire it into `src/lib/api.ts`:

```ts
const BASE_URL = import.meta.env.VITE_API_URL ?? "";
```

### Cookies / CORS

Easiest path: serve the SPA and the API on the same parent domain
(`app.yourcompany.com` + `api.yourcompany.com`) and set the session cookie
with:

```
Domain=.yourcompany.com; SameSite=Lax; Secure; HttpOnly; Path=/
```

Then `credentials: "include"` in `apiFetch` works without CORS preflight
gymnastics.

### Build commands

```
npm ci
npm run build       # outputs to dist/
```

`dist/` is plain static assets — host on S3+CloudFront, Nginx, Vercel,
Netlify, anything. No server-side rendering required.

---

## 9. Adding new fields later — what each scenario costs you

| Change in Lovable                                        | What you have to do                                          |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| New UI-only toggle (no save)                             | Nothing.                                                     |
| New field inside a property / scenario                   | Nothing — it lives inside `state_json`.                      |
| New top-level field on `clients` (e.g. `phone`)          | One migration: `alter table clients add column phone text;`  |
| New top-level field on `agents` / `scenarios` metadata   | Same — single migration.                                     |
| New entity type (e.g. "documents")                       | New table + endpoints + a new seam module.                   |

The deal: keep `ScenarioState` as a single JSON blob and the day-to-day
churn never touches the database.

---

## 10. Quick-start checklist

- [ ] Clone the repo, `npm ci`, `npm run dev` — confirm the prototype runs
      against localStorage.
- [ ] Provision Postgres + run the schema in §7.
- [ ] Stand up the API in §6 with httpOnly session-cookie auth.
- [ ] Set `VITE_API_URL` and wire `apiFetch` in `src/lib/api.ts`.
- [ ] Replace each `// TODO(backend)` block in the four seam files with
      `apiFetch(...)` calls. Keep signatures identical.
- [ ] Smoke test: log in as each of the three roles, save a scenario,
      share it with an agent, confirm the agent sees a read-only view.
- [ ] Set up CI to deploy `production` branch to `app.yourcompany.com`.
- [ ] Tell the business team you're done — they keep editing in Lovable
      and your pipeline picks up their commits.

---

## 11. Things to ask the business team before you start

- Which auth provider do we want? (Auth0, Cognito, Supabase Auth,
  custom JWT…) — the seam in `src/lib/auth.ts` doesn't care, but the
  decision affects login UX.
- SSO requirements? (Google Workspace? Microsoft 365?)
- Data residency / compliance constraints (AU? EU?) — affects DB region.
- Backup / retention policy for scenarios.
- Audit logging requirements (who viewed which client's scenario when).

---

Questions? The seam files are commented and the TODOs point at exact
endpoints. Start there, then come back to this doc for the bigger picture.
