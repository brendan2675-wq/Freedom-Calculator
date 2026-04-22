
## Comprehensive bug testing plan for Atelier Wealth Freedom App

I will create and run a structured QA process covering the areas most likely to break after the recent additions:

- scenario saving/loading/updating
- client/adviser/agent roles
- shared adviser-client scenarios
- unassigned adviser drafts
- property-linked cashflow tracker
- navigation and “can the user get stuck?” flows
- data limits, text limits, number formatting, dollar signs, and edge cases
- mobile/responsive usability
- read-only enforcement for agents

Because the app is currently a localStorage prototype, the test plan will focus on real browser behaviour, localStorage state transitions, and UI-level access control.

## 1. Testing methodology

I will use a combined QA approach:

### A. Risk-based testing

Prioritise the highest-risk areas first:

1. Role switching and stale context leakage
2. Scenario save/load/update consistency
3. Adviser acting as client
4. Agent read-only mode
5. Cashflow context leaking between scenarios/properties
6. Reset/logout/navigation behaviour
7. Boundary values and large datasets

### B. Regression testing

Re-test old core functionality after new role/scenario/cashflow changes:

- PPOR calculator
- Portfolio page
- property cards
- property sidebars
- proposed purchases
- sold properties
- drag-and-drop
- reset button
- scenario manager
- dashboard navigation

### C. Boundary and limit testing

Stress the app with:

- long names
- blank names
- many properties
- very large dollar amounts
- zero values
- decimals
- invalid dates
- old/future dates
- many scenarios
- many clients
- many agents
- multiple cashflow rows
- switching contexts repeatedly

### D. Permission testing

Confirm that each role sees and can do only what they should:

```text
Client  -> can build/edit own shared scenarios
Adviser -> can build/edit client and unassigned scenarios
Agent   -> can view shared scenarios only, no editing
```

### E. Navigation trap testing

Check every route and important button to confirm users can always:

- go forward
- go back
- exit modals
- exit adviser scenario mode
- return to dashboard
- logout
- recover from blank/empty states

### F. Exploratory UX testing

Look for issues that automated tests often miss:

- confusing labels
- missing dollar symbols
- unclear empty states
- clipped text
- overflowing cards
- hidden buttons
- too-small touch targets
- fields that accept surprising input
- stale scenario names appearing in the wrong place

## 2. Test environments and roles

I will test these sessions:

### Client session

```text
Role: Client
Name: Sam Client
Email: user@atelierwealth.com
```

Main checks:

- dashboard
- portfolio
- PPOR goal
- cashflow tracker
- scenario save/load/update
- reset
- logout/login
- shared adviser-built scenario visibility

### Adviser session

```text
Role: Adviser
Name: Alex Adviser
Email: user@atelierwealth.com
```

Main checks:

- adviser dashboard
- build assigned scenario
- build unassigned draft
- assign draft later
- open scenario as client
- edit scenario
- save/update scenario
- share scenario with agent
- property-linked cashflow picker

### Agent session

```text
Role: Agent
Name: Jordan Agent
Email: user@atelierwealth.com
```

Main checks:

- only shared scenarios are visible
- open portfolio read-only
- no add/edit/delete/reset/save controls
- cannot navigate into editable cashflow
- read-only messaging is clear

## 3. Automated test suite to add

The project already has Vitest configured. I will expand it from the current placeholder test into a proper regression suite.

### A. Scenario manager unit tests

Add tests for `src/lib/scenarioManager.ts`:

- save new scenario
- update existing scenario
- preserve `clientId`
- preserve `sharedAgentIds`
- preserve scenario `type`
- increment `version`
- set `lastEditedByName`
- set `lastEditedByRole`
- load active scenario
- detect version conflicts
- support unassigned adviser drafts
- assign draft to client and update `state.clientName`
- ignore malformed localStorage JSON safely

### B. Cashflow manager unit tests

Add tests for `src/lib/cashflowManager.ts`:

- save property-linked cashflow record
- retrieve by `scenarioId + propertyId + financialYear`
- prevent cross-scenario leakage
- save multiple years for same property
- update existing record and increment version
- preserve client linkage
- clear active cashflow context
- handle malformed localStorage safely

### C. Auth/session unit tests

Add tests for `src/lib/auth.ts` and login-related context behaviour:

- role is stored correctly
- user is stored correctly
- logout clears auth keys
- switching from adviser to client clears stale adviser acting context
- switching scenarios clears old cashflow context where expected

### D. Component behaviour tests

Add targeted React tests for:

- `ScenarioContextBanner`
  - client label: “Current scenario”
  - adviser label: “Adviser editing”
  - agent/read-only label: “Read-only scenario”
  - shows unassigned client clearly
  - hides edit action for agents/read-only mode

- `ScenarioManager`
  - client sees “My scenarios”
  - adviser sees “Client scenarios”
  - agent sees “Shared scenarios”
  - agent cannot see save/delete controls
  - unassigned adviser scenarios show “Needs client”

- `NewScenarioDialog`
  - existing client flow
  - new client flow
  - build without client flow
  - scenario name required before create

## 4. Browser QA flow to run

After the automated tests are added, I will run a real preview QA pass.

### Flow 1: client basic navigation

Steps:

1. Login as Client.
2. Confirm landing route is dashboard.
3. Open Portfolio.
4. Return to Dashboard.
5. Open PPOR Goal.
6. Return to Dashboard.
7. Open Cashflow Tracker.
8. Return to Dashboard.
9. Open scenario manager.
10. Close scenario manager.
11. Logout.
12. Confirm return to login.

Pass criteria:

- no dead ends
- every route has a clear way back
- no console errors
- no stale adviser/agent UI visible to client

### Flow 2: adviser build assigned scenario

Steps:

1. Login as Adviser.
2. Load demo data if needed.
3. Click Build scenario.
4. Pick an existing client.
5. Create scenario.
6. Confirm dashboard opens.
7. Confirm ScenarioContextBanner shows adviser editing the correct client/scenario.
8. Open Portfolio.
9. Add PPOR.
10. Add investment property.
11. Save/update scenario.
12. Return to Adviser dashboard.
13. Reopen same scenario.
14. Confirm data persists.

Pass criteria:

- no old client/scenario name appears
- saved data reloads correctly
- no orange top banner remains
- adviser can exit back to dashboard

### Flow 3: adviser unassigned draft

Steps:

1. Login as Adviser.
2. Click Build scenario.
3. Choose Build without client.
4. Create “Working Scenario”.
5. Add PPOR and investment property.
6. Save/update draft.
7. Return to Adviser dashboard.
8. Confirm draft is marked “Needs client”.
9. Assign draft to a client.
10. Reopen scenario.
11. Confirm client name updates but all built data remains.

Pass criteria:

- adviser can build without client
- no forced assignment modal interrupts draft flow
- assignment later preserves scenario ID/data
- context banner changes from unassigned to assigned client

### Flow 4: adviser property-linked cashflow

Steps:

1. Open adviser scenario with at least one investment property.
2. Use property cashflow picker from Adviser dashboard.
3. Open property cashflow.
4. Confirm linked property panel shows correct:
   - client
   - scenario
   - property
   - financial year
5. Enter rent, loan, rate, expenses.
6. Save cashflow.
7. Return to Adviser dashboard.
8. Open a different client/scenario.
9. Open cashflow.
10. Confirm previous property name/data does not leak.

Pass criteria:

- cashflow is linked to correct property/scenario/year
- switching scenario clears old cashflow context
- no “Dylan and Leah” style stale property context bug

### Flow 5: agent read-only

Steps:

1. Login as Adviser.
2. Add or confirm an agent exists.
3. Share a scenario with that agent.
4. Logout.
5. Login as Agent with matching email.
6. Open shared scenario.
7. Confirm read-only portfolio opens.
8. Try to find edit controls:
   - add property
   - delete property
   - reset
   - save scenario
   - editable sidebars
   - drag/drop
9. Try direct navigation to `/cashflow`.

Pass criteria:

- agent only sees shared scenarios
- no editable controls are exposed
- read-only banner/context is visible
- agent cannot accidentally edit local working state from shared view

### Flow 6: reset/logout/state isolation

Steps:

1. Login as Adviser.
2. Open a scenario.
3. Logout.
4. Login as Client.
5. Confirm adviser acting context is gone.
6. Confirm stale adviser scenario is not shown unless legitimately accessible.
7. Login as Agent.
8. Confirm no client/adviser edit state leaks.
9. Use reset button as client/adviser.
10. Confirm saved scenarios are preserved where intended.

Pass criteria:

- no cross-role leakage
- reset does not destroy saved scenarios unexpectedly
- active scenario handling is predictable

## 5. Limit and edge case test matrix

I will test these limits manually and/or with seeded localStorage data.

### Text limits

Fields to test:

- client name
- scenario name
- property nickname
- suburb
- trust name
- lender name
- cashflow row label

Inputs:

```text
blank
1 character
50 characters
150 characters
300 characters
special characters
emoji
apostrophes
ampersands
very long couple names
```

Pass criteria:

- no layout breaking
- cards truncate cleanly
- important names remain understandable
- no save/load corruption

### Number limits

Fields to test:

- property value
- loan balance
- purchase price
- deposit
- stamp duty
- other costs
- weekly rent
- interest rate
- LVR
- growth rate
- cashflow monthly values
- council/insurance/water/land tax amounts

Inputs:

```text
0
1
999
1,000,000
99,999,999
999,999,999
decimal values
negative values where possible
empty field
non-numeric paste
```

Pass criteria:

- currency fields show `$` where helpful
- commas are applied consistently
- percent fields allow decimals
- bad input does not crash calculations
- extreme values do not overflow cards/charts

### Property count limits

Test:

```text
0 properties
1 property
4 properties
5 properties
10 properties
20 properties
50 properties
```

Pass criteria:

- ribbon scrolling works
- `.scrollbar-thin` appears where expected
- add card remains reachable
- cards do not shrink into unusable states
- performance remains acceptable
- no drag/drop dead zones

### Scenario count limits

Test:

```text
0 scenarios
1 scenario
20 demo scenarios
50 scenarios
100 scenarios
long scenario names
duplicate scenario names
```

Pass criteria:

- scenario lists scroll
- search works
- active scenario is obvious
- duplicate name overwrite behaviour is clear
- no accidental data loss

### Client/agent limits

Test:

```text
0 clients
1 client
20 clients
100 clients
0 agents
1 agent
20 agents
```

Pass criteria:

- adviser can still build unassigned draft with no clients
- assign dialog remains usable
- share list scrolls
- empty states are clear

### Date limits

Test:

```text
blank date
today
past purchase date
future purchase date
far future date
invalid typed date
settlement before purchase
```

Pass criteria:

- date picker does not crash
- invalid typed dates do not corrupt state
- timeline labels remain understandable
- stamp duty calculations remain stable

## 6. UX audit checklist

I will inspect and document issues for:

### Navigation

- every main page has a clear back/dashboard action
- browser back does not trap users
- modals and sheets close reliably
- mobile users can close side sheets
- adviser can always return to adviser dashboard
- logout is always reachable

### Labels and formatting

- dollar fields show `$`
- percentage fields show `%`
- “Current scenario” vs “Adviser editing” vs “Read-only scenario” is role-appropriate
- “Needs client”/“Unassigned client” is clear
- save/update language is not confusing
- agent buttons say “View”, not “Load” or “Edit”

### Empty states

- no client scenarios
- no saved scenarios
- no agents
- no properties
- no cashflow context
- no active scenario
- unassigned adviser draft

### Mobile

Test viewport sizes:

```text
390 x 844  iPhone-style
768 x 1024 tablet
1343 x 1083 current preview size
```

Pass criteria:

- touch targets are at least 44px where practical
- header actions do not overflow
- cards are tappable
- scenario dialogs fit
- cashflow table remains usable or scrollable

### Accessibility basics

Check:

- buttons have visible labels or aria labels
- keyboard tab order is not obviously broken
- dialogs can be closed
- focus is not trapped incorrectly
- contrast is acceptable
- disabled buttons look disabled

## 7. Console and error monitoring

During browser QA I will monitor:

- console errors
- React warnings
- localStorage JSON parse failures
- navigation errors
- uncaught exceptions
- blank screens
- failed network requests, if any

Pass criteria:

- no uncaught runtime errors
- no repeated console spam
- no blank page after navigation
- no error loops after reset/login/logout

## 8. Deliverables I will produce

After the plan is approved and I can run implementation/testing, I will deliver:

### A. Automated regression tests

New or expanded tests for:

- scenario manager
- cashflow manager
- auth/session behaviour
- role-aware components

### B. Bug testing report

A file in `/mnt/documents/`, for example:

```text
/mnt/documents/atelier_wealth_bug_testing_report.md
```

It will include:

- test date
- build/context tested
- test coverage summary
- passed flows
- failed flows
- bugs found
- severity ranking
- reproduction steps
- recommended fixes
- UX improvements
- deferred/future backend security notes

### C. Prioritised bug backlog

Bugs will be ranked:

```text
P0 — blocks use / data loss / security issue
P1 — major broken workflow
P2 — confusing or incorrect behaviour
P3 — polish / UX improvement
```

### D. Optional fixes after test run

If you want, after I complete the test report I can immediately start fixing the highest-priority issues found.

## 9. Execution order

Once approved, I will run the QA process in this order:

1. Add automated unit/component regression tests.
2. Run existing test suite.
3. Fix any test setup issues.
4. Seed controlled test data where needed.
5. Run client browser QA.
6. Run adviser browser QA.
7. Run agent browser QA.
8. Run scenario/cashflow context switching tests.
9. Run edge-case and limit tests.
10. Run mobile viewport checks.
11. Review console/runtime errors.
12. Produce the final bug testing report.
13. Present the highest-priority fixes recommended.

## 10. Key areas I expect to scrutinise closely

Based on the recent changes, I will pay special attention to:

- stale `active-scenario-id`
- stale `cashflow-active-context`
- stale `adviser-acting-as`
- saved scenario version conflicts
- scenario name/client name mismatches
- agent read-only enforcement
- reset preserving or clearing the correct keys
- save vs update confusion
- unassigned adviser drafts later assigned to clients
- property-linked cashflow loading wrong property
- long names overflowing cards/dialogs
- missing `$` signs in money fields
- property count scrolling and performance
- mobile usability of scenario/cashflow controls
