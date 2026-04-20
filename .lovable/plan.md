

## What's broken & what to add

**Bug**: When an adviser clicks a scenario, `openScenario` navigates to `/`. But `RootRedirect` sends advisers back to `/adviser`, so nothing happens.

**Goal**: Let advisers walk into a client's dashboard + PPOR + Portfolio modules (the same views clients see), edit, and save back. Plus, when starting a new scenario, link it to an existing client or create a new client inline.

## Plan

### 1. Fix scenario-open routing for advisers
- Change `openScenario` in `AdviserHome.tsx` to navigate to `/dashboard` (or `/ppor-goal` directly) instead of `/`.
- Add a `/dashboard` route in `App.tsx` that renders `Home` and is allowed for `client` and `adviser` (currently `Home` only renders via `RootRedirect` for clients).
- Update `RootRedirect`: keep adviser → `/adviser`, but allow `/dashboard` as an explicit destination so advisers can land there.

### 2. "Acting as client" context banner
When an adviser opens a client's scenario, set a flag `adviser-acting-as` in localStorage with `{ clientId, scenarioId, clientName }`. On `Home`, `Index` (PPOR), and `Portfolio` pages, if the flag is present and current role is `adviser`, show a slim sticky banner at the top:

> Editing **Dennis & Jane Nguyen**'s scenario — *The Nguyens' Plan*    [Save changes] [Exit to dashboard]

- **Save changes** → calls `updateScenario(scenarioId, buildScenarioFromStorage())` and toasts.
- **Exit to dashboard** → clears the flag and `active-scenario-id`, navigates back to `/adviser`.

A small `AdviserActingBanner.tsx` component, mounted in `Home`, `Index`, `Portfolio`.

### 3. New scenario → pick or create client (inline)
Replace the current "Individual Scenario" action card flow. Instead of just navigating away:

- Click **Individual Scenario** → opens a `NewScenarioDialog` with:
  - A client picker (searchable list of existing clients, same `Client[]`)
  - A "+ New client" button that swaps the picker for an inline "Client name" input
  - A **Scenario name** input (defaulted to `"<Name>'s Plan"`)
  - **Create** button

- On Create:
  1. If new client → `upsertClient({ name })`
  2. Reset working storage to a clean slate (`applyScenarioToStorage` with blank state) so the adviser doesn't carry over the previous client's numbers
  3. `saveScenario(name, blankState, { clientId, ownerId, ownerRole: "adviser" })`
  4. Set `adviser-acting-as` flag and `active-scenario-id`
  5. Navigate to `/dashboard`

### 4. Make the recent-scenarios row actually work
The row click already calls `openScenario`. After fix #1 it will navigate correctly. Also wire up `applyScenarioToStorage` followed by setting the acting-as flag so the banner appears.

### 5. Tiny polish
- The "Previous Scenario" action card on AdviserHome currently opens scenario[0] but goes nowhere — fixed by #1.
- Adviser header can keep a "Back to Adviser dashboard" link in `UserMenu` already, but the banner makes exit obvious.

## Files touched
- `src/App.tsx` — add `/dashboard` route, adjust `RootRedirect`
- `src/pages/AdviserHome.tsx` — fix `openScenario` route, replace `startNew` with dialog flow, add `NewScenarioDialog`
- `src/pages/Home.tsx`, `src/pages/Index.tsx`, `src/pages/Portfolio.tsx` — mount `AdviserActingBanner`
- `src/components/AdviserActingBanner.tsx` — new component (Save/Exit)
- `src/components/NewScenarioDialog.tsx` — new component (client picker + inline create + scenario name)

## What stays the same
- LocalStorage as source of truth.
- `ScenarioManager`, `Client`/`Agent` storage shapes, role guard logic.
- Demo data flow.

## Out of scope
- Multi-tenant data separation (still single-browser localStorage).
- Editing a client's scenario in a side-by-side compare view.

