
Implement a cleaner Cashflow Tracker hierarchy: global scenario controls stay in the header, property/year cashflow controls move into the page context, and cashflow edits autosave.

## Recommended hierarchy

1. **Header: global app/scenario level**
   - Keep the top-right **Scenarios** control as the place for overall scenario save/load.
   - Keep **Sam Client** / user menu beside it.
   - Remove cashflow-specific saving from this top hierarchy so users do not see two competing save concepts.

2. **Cashflow context card: property/year level**
   - Replace the current “Linked property” language with clearer wording such as **Property cashflow**.
   - Make the selected property obvious:
     - Property name
     - Scenario/client context
     - Financial year
     - Last autosaved status
   - Move property switching into this card so existing-property users can easily switch without opening the detail sheet.

3. **Property switching**
   - Add a prominent existing-property selector in the context card:
     - “Property” dropdown showing all existing portfolio properties.
     - Selecting a property loads that property’s cashflow for the selected financial year.
     - If no saved cashflow exists yet for that property/year, prefill from portfolio data.
   - Keep the property detail tile and side sheet for editing the selected property’s details.
   - Keep **Add new** inside the side sheet or as a secondary action near the property selector.

4. **Remove manual “Save cashflow”**
   - Remove the **Save cashflow** button.
   - Cashflow should autosave whenever the user edits:
     - Monthly worksheet values
     - Property detail metrics
     - Council rates / insurance / land tax / water
     - Active month
     - Financial year/property context
   - Show a subtle status instead:
     - “Autosaved just now”
     - “Autosaved 2:14 PM”
     - Optionally “Saving…” during debounce.

5. **Keep “Save as new year”, but rename it**
   - Keep the function because it is still useful for rolling a cashflow forward.
   - Rename from **Save as new year** to something clearer like **Copy to another year**.
   - Keep it as a secondary outline action beside the FY selector.

## Specific UI changes

- Update the card currently showing:
  - “Linked property”
  - “New property”
  - FY selector
  - “Save cashflow”
  - “Save as new year”

To a structure like:

```text
Property cashflow

[Property selector: Brisbane townhouse v]   [FY2027 v]   [Copy to another year]

Scenario: Sam Client Base Plan
Autosaved 2:14 PM
```

- Remove the word **Linked** from the main page.
- Keep “Use existing / Add new” in the property detail sheet, but treat it as property management rather than the primary way to switch cashflows.
- If there are no existing properties, show a helpful empty state:
  - “No portfolio properties yet”
  - Button: “Add property”

## Autosave behaviour

- Add debounced autosave, likely around 600–1000ms after the last edit.
- When a `cashflowContext` exists, save via `saveCashflowForProperty(...)`.
- Continue writing the lightweight working state to localStorage as a fallback.
- Avoid success toasts on every autosave.
- Only use toasts for deliberate actions like:
  - Switching property loaded successfully
  - Copying to another year
  - Adding a new property
  - Exporting summary

## Existing property relevance

The concept is still relevant, but the label **Linked property** is no longer ideal.

Instead:
- The user is not “linking” a cashflow manually anymore.
- They are editing the **cashflow for a selected property**.
- The property selector should become the main control.
- The existing/new property function remains useful, but belongs in the property-management flow, not as a prominent label on the cashflow page.

## Technical implementation

- Update `src/pages/CashflowTracker.tsx`.
- Remove the visible **Save cashflow** button from the context card.
- Add an autosave state:
  - `autosaveStatus`
  - `lastAutosavedAt`
  - optional debounce timer ref
- Update the current persistence effect so property/year cashflow records are saved automatically using `saveCashflowForProperty`.
- Add a property selector to the context card using `portfolioProperties`.
- Reuse `linkPortfolioProperty(propertyId)` when switching properties.
- Ensure switching property/year loads the correct saved record if one exists.
- Rename the context card label from **Linked property** to **Property cashflow**.
- Rename **Save as new year** to **Copy to another year**.
- Consider removing or simplifying the cashflow-specific “Cashflow scenarios” dialog if it duplicates the global scenario control and creates hierarchy confusion.
- Run a build after implementation to confirm the Cashflow page compiles.

## Expected result

Users will understand the hierarchy more clearly:

- **Scenario controls** live in the header.
- **Cashflow controls** live in the Cashflow page.
- Existing-property users can quickly switch properties.
- Cashflow edits save automatically without needing a manual **Save cashflow** button.
- “Linked property” is replaced by clearer property/year cashflow context.
