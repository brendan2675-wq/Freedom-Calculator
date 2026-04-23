
Yes — for **clients**, the scenario control is becoming less relevant now that the tool is moving toward an autosaved, property/period-based workflow.

The scenario concept is still useful for **advisers** because they manage multiple clients, drafts, assignments, and shared plans. But for a client, seeing **“Scenario: No active scenario”** creates confusion because they are usually just working on their own current plan.

## Recommendation

Refine scenario visibility by role:

- **Clients:** hide or soften scenario controls unless there is an actual active scenario.
- **Advisers:** keep scenario controls because they need save/load/client assignment.
- **Agents:** keep read-only scenario context when viewing a shared plan.

## What will change

1. **Remove “Scenario: No active scenario” for clients**
   - In the Cashflow Tracker **Period & documents** card, do not show:
     ```text
     Scenario: No active scenario
     ```
   - If no scenario is active and the user is a client, replace it with a simpler status such as:
     ```text
     Current cashflow plan
     ```
     or omit the line entirely.

2. **Only show scenario name when it adds value**
   - If there is an active scenario, show:
     ```text
     Scenario: Sam Client Base Plan
     ```
   - If there is no active scenario:
     - Client: hide/soften the scenario line.
     - Adviser: keep a clear prompt/status because scenario assignment matters.
     - Agent: keep read-only scenario context if available.

3. **Review client-facing Scenario button usage**
   - On pages where clients currently see the global **Scenarios** button, simplify it.
   - Preferred client behaviour:
     - Clients do not need a prominent scenario save/load button in the header.
     - Their changes are autosaved/current-state based.
     - Scenario management can be adviser-facing, not client-facing.

4. **Keep adviser workflow intact**
   - Do not remove scenario management for advisers.
   - Advisers still need to:
     - Save scenarios
     - Load scenarios
     - Assign to clients
     - Share with agents
     - Manage drafts

5. **Update wording to match the new hierarchy**
   - Cashflow page should feel like:
     ```text
     Property + Period + Autosave
     ```
   - Not:
     ```text
     Scenario + Save + Load
     ```
   - This keeps the client experience simpler and avoids exposing internal planning terminology unless useful.

## Technical implementation

- Update `src/pages/CashflowTracker.tsx`.
- Import or use the current role from the existing auth helper.
- Change the Period & documents status area so it conditionally renders:
  - Active scenario name when present.
  - Adviser/agent scenario status when relevant.
  - No confusing **“No active scenario”** label for clients.
- Review `ScenarioManager` usage in the main PPOR header.
- If the current user role is `client`, hide the prominent **Scenarios** button or replace it with a less technical label only if needed later.
- Keep scenario controls available for `adviser` and appropriate read-only context for `agent`.
- Run a build after implementation.

## Expected result

Clients see a cleaner experience:

```text
Period ended 30 June 2027
Upload invoices / receipts
Autosaved 2:14 PM
```

Instead of:

```text
Scenario: No active scenario
```

Advisers still retain the full scenario management workflow where it is actually needed.
