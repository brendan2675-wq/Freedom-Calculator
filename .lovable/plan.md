
## Updated plan: shared scenarios, role-safe editing, and property-linked cashflow

Build the next version around one shared scenario that clients and advisers both edit, while agents remain read-only reviewers.

```text
Client
└── Shared scenario / strategy plan
    ├── Dashboard
    ├── PPOR / Freedom Calculator
    ├── Portfolio
    └── Property-linked Cashflow Trackers
        ├── Property A — FY2027
        └── Property B — FY2027
```

## 1. Scenario loading rules

Create a consistent loading model used by Dashboard, PPOR, Portfolio, and Cashflow:

- A single `active-scenario-id` controls the current working scenario.
- Loading a scenario always:
  - applies the scenario state to working localStorage
  - sets `active-scenario-id`
  - sets role/context metadata
  - refreshes or updates the page state consistently
- Cashflow adds one more layer:
  - `cashflow-active-context = scenarioId + propertyId + financialYear`

This avoids each page loading its own disconnected state.

## 2. Scenario save/update rules

Update scenario saving so all pages behave the same way:

- **Save as new scenario**
  - creates a new shared scenario
  - records creator role/name
  - assigns client if adviser is creating on behalf of a client

- **Update active scenario**
  - updates the current shared scenario
  - records who last edited it
  - updates `savedAt`
  - keeps the same `clientId`, agent sharing, and scenario type

- **Cashflow save**
  - updates the property-linked cashflow worksheet
  - records `lastEditedByRole` and `lastEditedByName`
  - does not create a floating generic cashflow unless no property context exists

## 3. Scenario metadata to add

Extend saved scenarios with collaboration metadata:

```ts
SavedScenario {
  id
  name
  savedAt
  state
  clientId
  ownerId
  ownerRole
  sharedAgentIds
  type

  lastEditedById
  lastEditedByName
  lastEditedByRole
  lastOpenedAt
  version
}
```

Add cashflow records:

```ts
CashflowRecord {
  id
  clientId
  scenarioId
  propertyId
  propertyType
  financialYear
  name
  state
  savedAt
  lastEditedById
  lastEditedByName
  lastEditedByRole
  version
}
```

The `version` field gives the prototype a basic conflict-warning system and mirrors what a backend would later use.

## 4. Role access model

### Client

Clients can:

- open scenarios assigned to them
- open scenarios they created
- edit Dashboard, PPOR, Portfolio, and Cashflow
- save/update the active scenario
- create their own scenario/playground copy if they want to experiment

Clients should see:

```text
You are editing
The Nguyens' Plan

Last updated by Alex Adviser · 22 Apr 2026
Shared with your adviser
[Open portfolio] [Open PPOR] [Open cashflow]
```

### Adviser

Advisers can:

- see all adviser-managed scenarios
- assign scenarios to clients
- open a scenario as the client
- edit the same Dashboard, PPOR, Portfolio, and Cashflow views
- build cashflow worksheets for individual properties
- share scenarios with agents as read-only

Advisers should see the existing acting-as banner, expanded slightly:

```text
Editing Dennis & Jane Nguyen's scenario — The Nguyens' Plan
Last updated by Dennis Nguyen · 22 Apr 2026
[Save changes] [Exit to adviser dashboard]
```

### Agent

Agents can:

- only see scenarios explicitly shared with them
- open shared scenarios in read-only mode
- view Portfolio and summary information
- not save, update, delete, reset, or edit fields

Agents should see:

```text
Read-only view — shared by Atelier Wealth
You can review this scenario but cannot make changes.
```

## 5. Prevent role clashes and bad edits

Add UI controls to stop confusion when different roles are working with the same scenario.

### A. Active scenario banner/panel

Add a reusable `ScenarioContextBanner` component used on:

- Dashboard
- PPOR
- Portfolio
- Cashflow

It displays:

- scenario name
- client name
- current role mode
- last edited by
- last saved time
- read-only status if applicable

### B. Unsaved changes warning

Track whether the working page has changes since the scenario was loaded or saved.

Show warning before:

- loading another scenario
- resetting data
- exiting adviser acting-as mode
- navigating away from a property-linked cashflow worksheet

Example:

```text
You have unsaved changes to The Nguyens' Plan.
[Save changes] [Discard and continue] [Cancel]
```

### C. Scenario version warning

When saving, compare the loaded `version` with the stored scenario `version`.

If the stored version has changed since the user loaded it, show:

```text
This scenario was updated by Dennis Nguyen after you opened it.

[Review latest version] [Overwrite anyway] [Save as copy]
```

For the current localStorage prototype this mainly protects multiple tabs or role switching in the same browser. Later it maps directly to backend conflict handling.

### D. Role-aware controls

Hide or disable controls by role:

- Agents:
  - no Save
  - no Update
  - no Delete
  - no Reset
  - no editable fields
  - no upload button
- Clients:
  - Save/update their accessible scenarios
  - no agent sharing controls
  - no client assignment controls
- Advisers:
  - assignment and agent sharing controls visible
  - acting-as banner visible
  - can save client scenarios

## 6. Scenario Manager changes

Update `ScenarioManager` so the same component works clearly across roles.

### Client view

Label it as:

```text
My scenarios
```

Show:

- scenario name
- active indicator
- last edited by
- last saved date
- Update active scenario
- Save as new scenario
- Load

Do not show:

- assign client
- share with agents

### Adviser view

Label it as:

```text
Client scenarios
```

Show:

- client name
- scenario name
- module icons
- last edited by
- assigned agents count
- Open as client
- Assign client
- Share with agents
- Delete

### Agent view

Label it as:

```text
Shared scenarios
```

Show:

- scenario name
- client name
- last updated
- read-only badge
- View only

Do not show save/load language that implies editing.

## 7. Adviser dashboard changes

Add a direct property/cashflow picker from each scenario.

Flow:

```text
Adviser dashboard
→ Client scenario
→ Select property for cashflow
→ Cashflow tracker opens with linked property context
```

The picker groups properties by:

- Owner occupied / PPOR
- Investment properties
- Trust-owned properties
- SMSF properties
- Proposed purchases later if required

On selection:

1. apply the selected scenario to working state
2. set `active-scenario-id`
3. set adviser acting-as context
4. set property cashflow context
5. navigate to `/cashflow`

## 8. Client dashboard changes

Add a current scenario panel near the top of the dashboard.

If a scenario is active:

```text
Current scenario
The Nguyens' Plan
Last updated by Alex Adviser

[Portfolio] [PPOR] [Cashflow]
```

If no scenario is active:

```text
Start your plan
Create or load a scenario before editing your portfolio and cashflow.
```

This helps clients understand they are editing a shared strategy, not disconnected tools.

## 9. Portfolio page changes

Add property-level cashflow actions.

Each relevant property card should expose:

```text
[Open cashflow]
```

When clicked:

- set active cashflow context
- pre-fill the cashflow tracker from that property
- load existing worksheet if it exists
- otherwise create a blank worksheet for the selected financial year

For agents, show cashflow availability as read-only later, but do not allow edits.

## 10. Cashflow tracker changes

Replace the current generic cashflow scenario system with property-linked records while preserving backwards compatibility.

The Cashflow page should load in this order:

1. active property-linked cashflow context
2. existing generic cashflow working state, for old prototype data
3. blank worksheet

Add a context panel:

```text
Linked property
Dennis & Jane Nguyen
The Nguyens' Plan
Bondi IP1 — Investment property
FY2027

Last updated by Alex Adviser
[Change property] [Change year] [Save cashflow]
```

Keep:

- prominent upload button near the top
- editable rows
- deletable rows
- zero defaults
- export summary

Add:

- Save cashflow
- Save as new financial year
- Change property
- Change year
- last edited metadata

## 11. PPOR and Portfolio save consistency

PPOR and Portfolio currently write directly to localStorage. Keep that for the prototype, but add a shared save/update helper so the active scenario can be updated consistently from any page.

Recommended helper:

```ts
saveActiveScenarioFromWorkingState()
```

It should:

- read current working state
- update the active scenario
- preserve assignment/share metadata
- stamp last edited metadata
- increment version
- show success/failure toast

Use this from:

- adviser acting-as banner
- ScenarioManager update button
- Dashboard current scenario panel
- future explicit save buttons

## 12. Read-only enforcement for agents

Strengthen agent read-only mode:

- route agents only to allowed read-only pages
- keep `/cashflow` adviser/client only for now
- ensure Portfolio read-only mode hides/disables:
  - ScenarioManager save/update
  - reset
  - editable property sheets
  - drag/drop
  - delete/add buttons
- keep `ReadOnlyBanner` visible

Important: this remains UI-only in the localStorage prototype. A backend version must enforce permissions server-side.

## 13. Files to update

- `src/lib/scenarioManager.ts`
  - add metadata fields
  - add versioning
  - add active scenario helpers
  - preserve old scenarios via safe defaults

- `src/lib/cashflowManager.ts`
  - new helper for property-linked cashflow records and active cashflow context

- `src/components/ScenarioManager.tsx`
  - role-aware labels and controls
  - last edited display
  - conflict warning support

- `src/components/ScenarioContextBanner.tsx`
  - new shared scenario context panel/banner

- `src/components/AdviserActingBanner.tsx`
  - include last edited details
  - use shared active scenario save helper

- `src/pages/AdviserHome.tsx`
  - property/cashflow picker
  - clearer client/scenario metadata
  - direct open-as-client flow

- `src/pages/Home.tsx`
  - current scenario panel for clients and advisers

- `src/pages/Portfolio.tsx`
  - property-level cashflow actions
  - stronger agent read-only control handling

- `src/pages/Index.tsx`
  - use shared scenario context display
  - keep PPOR saves aligned with active scenario

- `src/pages/CashflowTracker.tsx`
  - property-linked cashflow loading/saving
  - context panel
  - change property/year workflow
  - role-aware controls

## 14. Recommended first implementation pass

Implement in this order:

1. Scenario metadata/versioning helpers
2. Shared scenario context banner
3. Role-aware ScenarioManager updates
4. Client dashboard current scenario panel
5. Property-linked cashflow manager
6. Adviser property-to-cashflow picker
7. Portfolio property cashflow actions
8. Cashflow tracker context/save/load refactor
9. Agent read-only hardening
10. Unsaved-change and version-conflict warnings

This keeps the client, adviser, and agent experiences aligned while preserving the current localStorage prototype and preparing the app for a future backend.
