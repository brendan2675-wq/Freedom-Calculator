

## Login + Role-Based Landing Pages

A new `/login` page becomes the entry point. The user picks a role (Client / Adviser / Agent), and we route them to the right landing experience. All UI-only, persisted in localStorage — no backend yet.

### New routes
```text
/login          → Role-pick login screen (everyone starts here)
/               → Client dashboard (Role 1 — current Home page)
/adviser        → Adviser landing (Role 2 — clients, scenarios, agents)
/agent          → Agent landing (Role 3 — read-only scenarios shared with them)
/ppor-goal      → Existing (gated by role)
/portfolio      → Existing (gated by role)
```

### Role model (localStorage)
- `auth-role`: `"client" | "adviser" | "agent"`
- `auth-user`: `{ id, name, email, role }`
- `clients`: `Client[]` — `{ id, name, email, agentIds: string[] }`
- `agents`: `Agent[]` — `{ id, name, email }`
- Extend `SavedScenario` with `clientId`, `ownerId`, `sharedAgentIds[]`, `type: "individual" | "smsf"`

A small `useAuth()` hook + `<RoleGuard allow={[...]}>` wrapper enforces access. Agents only ever see scenarios where their id is in `sharedAgentIds`; they open them via a read-only flag that disables inputs/save.

### Adviser landing (`/adviser`)
Mirrors the screenshot:
- Greeting "G'day {name}"
- 3 top action cards: **+ Individual Scenario**, **+ SMSF Scenario**, **Previous Scenario** (resumes last edited)
- **Your recent scenarios** list with search + "See all" — rows show scenario name, client sub-line, value, created by/date, type pill (Individual/SMSF), arrow → opens in `/portfolio`
- Tabs below: **Clients** (grouped: client → their scenarios, with create/edit/delete) and **Agents** (Role 3 directory with create/edit/delete + count of scenarios shared)

Clicking "+ Individual/SMSF" opens the standard dashboard (`/`) in scenario-build mode; on save, an "Assign to client" dialog lets the adviser attach the scenario to a client and optionally share with agents.

### Client landing (`/`)
Unchanged — current Home / dashboard. Client only sees their own scenarios in `ScenarioManager`.

### Agent landing (`/agent`)
- Greeting + simple list of scenarios shared with them
- Each row → opens `/portfolio?readonly=1` which disables all editing controls, hides Save/Reset, shows a "Read-only — shared by {adviser}" banner

### Sharing
Inside `ScenarioManager`'s saved-scenario list (Adviser only), add a **Share** icon → dialog with checkboxes for each agent. Updates `sharedAgentIds` on the scenario.

### Files to add
- `src/pages/Login.tsx` — role-pick login (extends current `AuthFlow` visuals)
- `src/pages/AdviserHome.tsx` — landing per screenshot
- `src/pages/AgentHome.tsx` — read-only scenario list
- `src/lib/auth.ts` — role/user helpers + `useAuth()` hook
- `src/lib/clients.ts` — clients/agents CRUD in localStorage
- `src/components/RoleGuard.tsx` — route protection
- `src/components/AssignClientDialog.tsx` — assign scenario to client + agents
- `src/components/ShareWithAgentsDialog.tsx` — per-scenario agent sharing
- `src/components/ReadOnlyBanner.tsx`

### Files to update
- `src/App.tsx` — add new routes, redirect `/` → `/login` if no `auth-role`, route by role after login
- `src/lib/scenarioManager.ts` — extend `SavedScenario` with `clientId`, `ownerId`, `sharedAgentIds`, `type`; filter helpers per role
- `src/components/ScenarioManager.tsx` — show Share button (adviser), filter list by role
- `src/pages/Home.tsx` & `src/pages/Portfolio.tsx` — honour `?readonly=1`, role-aware header (logout)
- `src/components/Header.tsx` — replace static profile with role badge + Logout

### Out of scope (next pass if wanted)
- Real auth + RLS via Lovable Cloud
- Email-based agent invites
- Scenario change history per role

