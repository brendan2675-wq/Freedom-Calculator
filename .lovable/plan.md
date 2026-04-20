

## Migrate All Persistence to Cloud (No localStorage for User Data)

You want **zero reliance on localStorage** for anything a Client or Adviser saves. Everything — auth, scenarios, clients, agents, sharing — moves to a real backend the developer hosts on your company domain. localStorage stays only for trivial UI state (e.g. "has the user dismissed the disclaimer toast").

This plan answers two questions:
1. What needs to change to move all persistence off localStorage.
2. How to keep adding features in Lovable without breaking the cloud setup.

---

### 1. What's currently in localStorage (must move to cloud)

| Key | Purpose | Cloud destination |
|---|---|---|
| `auth-role`, `auth-user` | Mock login session | Real auth provider session (JWT/cookie) |
| `saved-scenarios` | All saved scenarios + sharing metadata | `scenarios` + `scenario_shares` tables |
| `clients` | Adviser's client directory | `clients` table |
| `agents` | Adviser's agent directory | `agents` table |
| `portfolio-ppor`, `portfolio-properties`, `portfolio-future-properties`, `client-name`, `global-interest-rate`, `target-month`, `target-year`, `growth-rate`, `ppor-suburb`, `ppor-starting-balance` | The "current working scenario" — the live state of the dashboard | Loaded from / saved to a single `scenarios.state_json` row on the server |

### 2. What can stay in localStorage (safe to wipe)

- `disclaimer-shown`, `welcome-dismissed`, onboarding tip flags — pure UI prefs, regenerated on next visit
- Anything in `mem://` (that's Lovable-side memory, not user data)

---

### 3. Architecture the developer should build

```text
[ React app (Lovable) ]  →  [ Your API on company domain ]  →  [ Postgres DB ]
        |                              |
        |  JWT in httpOnly cookie      |
        |  VITE_API_URL env var        |
```

**Tables**
```sql
profiles(id, name, email, created_at)
user_roles(user_id, role)            -- 'client' | 'adviser' | 'agent'
clients(id, adviser_id, name, email, created_at)
client_agents(client_id, agent_id)   -- which agents an adviser has linked to a client
agents(id, name, email, agency, created_at)
scenarios(
  id, name, type,                    -- 'individual' | 'smsf'
  owner_id, client_id,
  state_json,                        -- the entire ScenarioState blob
  updated_at, created_at
)
scenario_shares(scenario_id, agent_id, granted_by, granted_at)
```

**Endpoints (minimum)**
```text
POST /auth/login, /auth/logout, GET /auth/me
GET/POST/PATCH/DELETE /clients
GET/POST/PATCH/DELETE /agents
GET/POST/PATCH/DELETE /scenarios
POST /scenarios/:id/shares     (adviser grants agent read access)
GET  /scenarios/:id/state      (read-only honoured server-side for agents)
```

**Critical**: read-only access for agents is enforced **on the server** via the `scenario_shares` table — not by a `?readonly=1` URL flag (that flag is only a UI hint).

---

### 4. How to make the swap painless: a thin "data layer"

Right now the app calls `localStorage.getItem(...)` directly from many components. To make the migration a one-shot job for your developer, we should refactor every persistence call behind **three small modules** that act as the only seam between UI and storage:

```text
src/lib/scenarioManager.ts   ← already the seam for scenarios
src/lib/clients.ts           ← already the seam for clients/agents
src/lib/auth.ts              ← already the seam for session
src/lib/workingScenario.ts   ← NEW seam for the live dashboard state
                                (wraps the 10+ portfolio-* keys)
```

Today these files use `localStorage` internally. The developer's job becomes: **swap the body of each function from localStorage to `fetch(VITE_API_URL + ...)`**, leaving every component untouched. No hunting through 40 files.

We'll also add a tiny `src/lib/api.ts` with a single `apiFetch()` helper so the developer only needs to wire base URL + auth header in one place.

---

### 5. What changes in this plan (Lovable-side)

**Files to add**
- `src/lib/workingScenario.ts` — wraps the current `buildScenarioFromStorage` / `applyScenarioToStorage` logic so all "live dashboard" reads/writes go through one module
- `src/lib/api.ts` — placeholder `apiFetch()` that today just calls the local helpers, tomorrow calls your API
- `BACKEND_INTEGRATION.md` (project root) — the spec to hand the developer: tables, endpoints, env vars, RLS rules, file map of seams to swap

**Files to refactor (no behaviour change yet — just routing through seams)**
- `src/pages/Home.tsx`, `src/pages/Portfolio.tsx`, `src/pages/AdviserHome.tsx`, `src/pages/AgentHome.tsx`, `src/components/ScenarioManager.tsx`, `src/components/PporDetailSheet.tsx`, `src/components/KeyInputs.tsx`, etc. — replace direct `localStorage.getItem('portfolio-*')` calls with `workingScenario.read()` / `.write()`
- `src/lib/auth.ts`, `src/lib/clients.ts`, `src/lib/scenarioManager.ts` — keep public API identical, mark internals with a `// TODO(backend): replace with apiFetch` comment so the dev sees exactly where to swap

**No visual or functional changes.** The app behaves identically; it's purely a structural cleanup so the cloud migration is a contained job.

---

### 6. Ongoing workflow once the backend is live

Your concern: "If I add a new field in Lovable later, does the developer have to redo work?"

Answer with this structure: **mostly no**. Here's the pattern:

- Adding a UI-only field (e.g. a new toggle that affects calculation only) → zero backend change.
- Adding a field that needs to persist (e.g. "client phone number") → 3 small steps:
  1. Add field to the TypeScript type (e.g. `Client.phone?: string`)
  2. Lovable auto-saves it inside the existing JSON blob (`scenarios.state_json`) or as a new column the dev adds via one migration
  3. Tell the developer "new field on `clients`: `phone text`" — one migration, done

For scenario internals (PPOR details, properties, sale costs etc.) — these all live inside `state_json`, so **adding new scenario fields requires zero backend work**. That's why we keep the entire `ScenarioState` as a single JSON column.

---

### 7. Deliverables

1. The 3 new files above (`workingScenario.ts`, `api.ts`, `BACKEND_INTEGRATION.md`)
2. Refactor of all direct `localStorage` calls into the four seam modules
3. A clear "swap-list" comment in each seam pointing to where the developer plugs in `fetch()`

Once approved, the developer gets a repo where migrating to cloud means editing **4 files**, not 40.

