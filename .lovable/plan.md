
## Plan: remove the adviser top banner and add adviser “build first, assign later” mode

### 1. Remove the orange adviser editing banner after a scenario is loaded

The current orange/white floating banner is `AdviserActingBanner`. It is helpful for confirming that an adviser opened a client scenario, but once the scenario is loaded it is taking too much space and duplicating the scenario context already shown elsewhere.

I will remove it from the main working pages:

- Dashboard
- PPOR Goal
- Portfolio
- Cashflow Tracker

This means advisers will no longer see the persistent top banner saying:

```text
Editing Noah and Ava Murphy's scenario — The Murphys' Plan
[Save changes] [Exit]
```

### 2. Keep the important controls, but move them into less obtrusive places

Because the banner currently contains “Save changes” and “Exit”, I will keep those actions available elsewhere.

For advisers, the existing `ScenarioContextBanner` will become the primary lightweight scenario identity panel. It will show:

```text
Adviser editing
The Murphys' Plan
Noah and Ava Murphy · Last updated by Alex Adviser

[Update scenario] [Adviser dashboard]
```

Changes:

- Add an optional “Adviser dashboard” / “Exit adviser mode” button inside `ScenarioContextBanner` when the current user is an adviser.
- Keep the existing “Update scenario” button there.
- Ensure this panel stays inside page content, not sticky across the top.
- Use compact styling on pages where vertical space matters.

This gives advisers a clear way back without the top banner being constantly visible.

### 3. Preserve adviser acting context internally

Even though the visible banner will be removed, I will keep the underlying `adviser-acting-as` context because it is still useful for:

- knowing which client/scenario the adviser opened
- saving the right active scenario
- cashflow context linking
- future backend migration

The key change is:

```text
Keep the context.
Remove the persistent visual banner.
Move actions into page-level context controls.
```

### 4. Add adviser “build first, assign later” mode

Advisers should be able to open the app, start building a strategy immediately, and assign it to a client later.

I will update the adviser dashboard flow so advisers can choose:

```text
New scenario
├── Assign to existing client
├── Create new client
└── Build first, assign later
```

The new unassigned option will create a scenario with:

```ts
clientId: undefined
ownerId: adviserUserId
ownerRole: "adviser"
state.clientName: "Unassigned client"
name: adviser-entered scenario name
```

Suggested default name:

```text
Working Scenario
```

or, if the adviser enters one:

```text
Strategy draft
```

### 5. Adviser dashboard UI changes

On the adviser dashboard, I will adjust the action cards so the workflow is clearer:

Current:

```text
Individual Scenario
Previous Scenario
```

Updated:

```text
Build scenario
Start from a clean slate. Assign to a client now or later.

Previous scenario
Resume your latest saved scenario.
```

Inside the “Build scenario” dialog:

- Existing client search remains.
- New client creation remains.
- Add a new “Build without client” option.
- Make it clear this can be assigned later.

Example copy:

```text
Not ready to link this to a client?
Start an unassigned working scenario and assign it later from your scenario list.
```

### 6. Scenario list support for unassigned adviser scenarios

The adviser scenario list already has assignment controls, but I will make unassigned scenarios more obvious.

For adviser scenarios with no `clientId`, display:

```text
Unassigned draft
```

or a badge:

```text
Needs client
```

Each unassigned row will keep the existing assign button, so the adviser can later choose:

- client
- scenario type
- shared agents

### 7. Scenario saving behaviour for unassigned drafts

When advisers save a new scenario from inside the app:

- If it was created as an unassigned draft, it should stay unassigned.
- Do not force the assign-client dialog immediately.
- Show a clear toast:

```text
Saved draft. You can assign it to a client later from Adviser Home.
```

For assigned scenarios, keep the current shared scenario behaviour.

### 8. Loading behaviour for unassigned drafts

When an adviser opens an unassigned draft:

- Load it exactly like any other scenario.
- Set it as the active scenario.
- Do not show the top adviser acting banner.
- Show scenario context as:

```text
Adviser editing
Working Scenario
Unassigned client · Last updated by Alex Adviser

[Update scenario] [Adviser dashboard]
```

This lets advisers freely use Dashboard, PPOR, Portfolio, and Cashflow without needing a client first.

### 9. Assign later workflow

When the adviser later assigns the draft to a client:

- Update `clientId`
- Update `state.clientName`
- Preserve all built scenario data
- Preserve scenario ID so existing links and cashflow records remain connected
- Update the display from “Unassigned draft” to the selected client name

If there are property-linked cashflow records already attached to the unassigned scenario, they will continue to belong to the same `scenarioId`, and the client relationship will be added through the scenario metadata.

### 10. Files to update

- `src/components/AdviserActingBanner.tsx`
  - Either remove visual rendering or leave only helper functions/context exports.
  - Keep `getActingAs`, `setActingAs`, and `clearActingAs` for internal context.

- `src/pages/Home.tsx`
  - Remove visible `AdviserActingBanner`.

- `src/pages/Index.tsx`
  - Remove visible `AdviserActingBanner`.

- `src/pages/Portfolio.tsx`
  - Remove visible `AdviserActingBanner`.

- `src/pages/CashflowTracker.tsx`
  - Remove visible `AdviserActingBanner`.

- `src/components/ScenarioContextBanner.tsx`
  - Add adviser dashboard / exit control.
  - Improve display for unassigned scenarios.
  - Keep update/save controls.

- `src/components/NewScenarioDialog.tsx`
  - Add “Build without client” mode.
  - Allow creating a scenario without a client.

- `src/pages/AdviserHome.tsx`
  - Update create-scenario handler to accept optional client.
  - Create clean unassigned drafts.
  - Improve action card copy.
  - Display unassigned scenario badges.

- `src/components/ScenarioManager.tsx`
  - Avoid forcing assign-client dialog after adviser saves an unassigned draft.
  - Show better labels for unassigned adviser drafts.

- `src/lib/scenarioManager.ts`
  - Ensure scenario metadata safely supports `clientId: undefined`.
  - Add helper/default handling for unassigned adviser drafts if needed.

### 11. Resulting adviser experience

The new flow will feel like this:

```text
Adviser logs in
→ Clicks Build scenario
→ Chooses Build without client
→ Lands on Dashboard with clean slate
→ Builds PPOR / Portfolio / Cashflow
→ Saves draft
→ Later assigns the draft to Noah and Ava Murphy
```

And the persistent top banner will be gone once the scenario is loaded.
