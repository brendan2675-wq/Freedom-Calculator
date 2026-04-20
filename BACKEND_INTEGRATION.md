# Backend Integration Guide

This document is for the backend developer taking the prototype to production
on your own infrastructure (separate from Lovable Cloud).

The frontend is a **React 18 + Vite 5 + TypeScript** app, styled with
**Tailwind CSS** and **shadcn/ui**. Charts use **Recharts**. Routing uses
**react-router-dom**. There is no backend code in this repo today — every
piece of user data is stored in the browser's `localStorage`.

Your job is to:

1. Stand up a hosted API + database on the company domain.
2. Replace the four "seam" modules' localStorage internals with real
   network calls. **No component code should need to change.**

---

## 1. Tech specs

| Concern        | Choice                                        |
| -------------- | --------------------------------------------- |
| Framework      | React 18 + Vite 5 + TypeScript 5              |
| Styling        | Tailwind CSS v3, shadcn/ui (Radix primitives) |
| Routing        | react-router-dom                              |
| State          | Component state + localStorage (today)        |
| Build          | `npm run build` → static `dist/`              |
| Node           | 18+                                           |
| Package mgr    | npm (lockfile in repo)                        |

The built output is plain static assets. Host them anywhere (S3+CloudFront,
Vercel, Netlify, Nginx) and point the API at the same domain (or a
subdomain like `api.yourcompany.com`) so cookies work without CORS pain.

---

## 2. The four seam modules

These are the **only** files that read or write user data. Everything else
in the UI just calls them. To migrate to the cloud you will rewrite the
internals of these four files; the public function signatures must stay the
same.

| File                          | Responsibility                                            |
| ----------------------------- | --------------------------------------------------------- |
| `src/lib/auth.ts`             | Current user + role, login session, logout                |
| `src/lib/clients.ts`          | Adviser's clients & agents directories (CRUD)             |
| `src/lib/scenarioManager.ts`  | Saved scenarios + sharing metadata                        |
| `src/lib/workingScenario.ts`  | The live "in-progress" dashboard state the user is editing|

There is also `src/lib/api.ts` — a placeholder `apiFetch()` helper. Wire your
base URL + auth headers there once and reuse it across all four seams.

Each seam file already has a `// TODO(backend):` block at the top listing
the exact endpoints it should call. Search the repo for `TODO(backend)` to
find every swap point.

---

## 3. Suggested database schema (Postgres)

```sql
-- Users handled by your auth provider; mirror the bits the app needs.
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

-- Which agents an adviser has linked to a given client (default share list).
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

-- Per-scenario read-only access for agents.
create table scenario_shares (
  scenario_id uuid references scenarios(id) on delete cascade,
  agent_id    uuid references agents(id)    on delete cascade,
  granted_by  uuid references profiles(id),
  granted_at  timestamptz default now(),
  primary key (scenario_id, agent_id)
);
```

**Why `state_json`?** The "scenario state" is a deeply nested object
(PPOR, properties, loan splits, sale costs, etc.) that evolves often as we
add UI features. Storing it as a single JSON column means **adding new
fields in the UI requires zero database migrations**. Only the top-level
metadata (name, type, owner, client, sharing) needs real columns.

---

## 4. Minimum endpoints

```text
# Auth
POST   /auth/login              { email, password } → sets session cookie
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

# Working scenario (the live dashboard the user is editing)
GET    /scenarios/current       → ScenarioState
PATCH  /scenarios/current       → ScenarioState
```

### Authorisation rules

| Caller role | Can see                                                                |
| ----------- | ---------------------------------------------------------------------- |
| client      | their own scenarios only (`owner_id = me`)                             |
| adviser     | scenarios they own + scenarios where `client_id` belongs to one of their clients |
| agent       | scenarios where `(scenario_id, me)` exists in `scenario_shares`, **read-only** |

> The frontend uses `?readonly=1` as a UI hint to disable inputs for agents.
> Do **not** trust this flag server-side. Enforce read-only by rejecting any
> write where the caller is an agent.

---

## 5. Environment & deployment

The frontend reads its API base URL from a Vite env var:

```bash
# .env (or platform secrets)
VITE_API_URL=https://api.yourcompany.com
```

After setting it, wire it into `src/lib/api.ts`:

```ts
const BASE_URL = import.meta.env.VITE_API_URL ?? "";
```

CORS / cookies: easiest path is to serve the SPA and the API on the same
parent domain (e.g. `app.yourcompany.com` + `api.yourcompany.com`) and set
the session cookie with `Domain=.yourcompany.com; SameSite=Lax; Secure;
HttpOnly`. Then `credentials: "include"` in `apiFetch` works without CORS
preflight headaches.

---

## 6. Working with Lovable after the backend is live

The team will keep editing the UI in Lovable. To stay in sync without
losing your backend integration:

1. **Connect Lovable to GitHub.** Lovable will push UI changes to a branch
   on a repo you control.
2. **Pull from that branch** into your dev environment, run/test against
   your real API, merge to `main`, and deploy.
3. **Don't edit the four seam files in your fork** unless you're swapping
   localStorage for `apiFetch`. If Lovable later changes the public API of
   a seam (e.g. a new function), reapply your localStorage→apiFetch swap to
   that new function only.

### Adding new persistent fields later

| Change in Lovable                                        | What you have to do                                  |
| -------------------------------------------------------- | ---------------------------------------------------- |
| New UI-only toggle (no save)                             | Nothing.                                             |
| New field inside a property / scenario                   | Nothing — it lives inside `state_json`.              |
| New top-level field on `clients` (e.g. `phone`)          | One column add: `alter table clients add column phone text;` |
| New top-level field on `agents` / `scenarios` metadata   | Same — single migration.                             |
| New entity type (e.g. "documents")                       | New table + endpoints + a new seam module.           |

The deal: keep `ScenarioState` as a single JSON blob and the day-to-day
churn never touches the database.

---

## 7. localStorage keys that are SAFE to keep

These are pure UI flags. Losing them only re-shows a toast or dialog:

- `disclaimer-shown`
- `welcome-dismissed`
- `tip-shown` and other onboarding flags

Everything else currently in localStorage (session, scenarios, clients,
agents, the `portfolio-*` and `target-*` and `*-rate` keys) **must** move to
the API. The UI keys safe-list lives in `src/lib/workingScenario.ts` as
`UI_ONLY_LOCALSTORAGE_KEYS`.

---

## 8. Quick-start checklist

- [ ] Provision Postgres + run the schema in §3.
- [ ] Stand up the API in §4 with session-cookie auth.
- [ ] Set `VITE_API_URL` and wire `apiFetch` in `src/lib/api.ts`.
- [ ] Replace the body of each `// TODO(backend)` block in the four seam
      files with `apiFetch(...)` calls. Keep signatures identical.
- [ ] Smoke-test: log in as each of the three roles, save a scenario, share
      it with an agent, confirm the agent sees a read-only view.
- [ ] Deploy SPA + API on the same parent domain so the session cookie
      works without CORS gymnastics.
