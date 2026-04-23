
# Plan: Cashflow Tracker detail/overall view switch, excluding monthly cashflow and cashflow yield

## Goal
Add an **Overall view** to the Cashflow Tracker so users can compare each property’s annual cashflow position side-by-side, while keeping the existing worksheet as the **Detail view**.

The Overall view will **not** include monthly cashflow figures and will **not** include cashflow yield.

## 1. Add a Detail / Overall view switcher

Add a segmented control near the Cashflow Tracker header:

```text
Detail view | Overall view
```

- **Detail view** keeps the current per-property worksheet.
- **Overall view** shows portfolio-level annual summary measures per property.
- The selected view will be saved to localStorage so users return to the same view.

## 2. Keep the existing worksheet as Detail view

The current monthly cashflow worksheet remains unchanged in functionality:

- Property selector
- Financial year selector
- FY document upload/review
- Editable cashflow sections
- Autosave by property/year
- Existing export behaviour for the detailed worksheet

This view remains the place where users enter detailed per-property cashflow information.

## 3. Add an Overall view for property comparison

Create a new portfolio comparison view that lists each property and shows annual summary measures, similar to the property detail tile.

Per property, show:

- Property name
- Ownership structure
- Current value
- Current loan
- Weekly rent
- Annual rental income
- Annual expenses
- Net annual cashflow
- Holding cost if the property is negative
- Rental yield
- Status badge:
  - Positive
  - Neutral
  - Negative

Do **not** show:

- Monthly cashflow
- Cashflow yield

Example:

```text
Overall cashflow
-------------------------------------------------------------
Property        Income p.a.   Expenses p.a.   Net p.a.   Status
Brisbane Unit   $31,200       $38,400         -$7,200    Negative
Perth House     $36,400       $29,900          $6,500    Positive
```

## 4. Use saved worksheet data where available

For each property in the selected financial year:

- If a saved cashflow worksheet exists, use its saved annual income, expenses, and net annual cashflow.
- If no worksheet exists, still show the property with a clear “No worksheet yet” state.
- Include an action to open that property in Detail view so users can enter or review the worksheet.

This keeps localStorage as the real-time source of truth and avoids making hidden assumptions where no worksheet data exists.

## 5. Add household income inputs for negative gearing estimates

In Overall view, add an **Income & tax estimate** panel.

Fields:

- Your taxable income
- Partner taxable income, optional
- Partner included toggle
- Optional Medicare levy toggle, if it fits cleanly with the existing tax logic
- Short note that this is an estimate only and not tax advice

Example:

```text
Income & tax estimate
Your income:       $180,000
Partner income:    $120,000
Partner included:  Yes
```

Persist these inputs to localStorage.

## 6. Estimate negative gearing benefits

For properties with negative annual cashflow:

- Calculate the annual loss.
- Estimate the tax benefit using Australian resident marginal tax rates.
- If a partner is included, split personally owned property losses 50/50 by default.
- If no partner is included, allocate 100% to the primary user.
- Trust-owned or SMSF properties should show a caveat instead of being treated like personal ownership.

Display portfolio-level annual figures:

- Total annual portfolio cashflow before estimated tax benefit
- Estimated negative gearing benefit
- Estimated after-tax annual cashflow

Do **not** display monthly after-tax impact.

Example:

```text
Portfolio before tax:        -$18,000 p.a.
Estimated tax benefit:        $6,840 p.a.
After-tax cashflow estimate: -$11,160 p.a.
```

## 7. Add per-property negative gearing comparison

In each property row/card, show tax impact fields only where relevant:

- Annual loss, if applicable
- Estimated tax benefit
- After-tax annual cashflow

Do **not** show monthly after-tax cost.

This helps users compare which properties are costing or contributing the most annually after estimated tax effects.

## 8. Make the Overall view responsive

Desktop:

- Summary cards across the top
- Income/tax estimate panel near the comparison table
- Full property comparison table below

Mobile:

- Summary cards stack
- Each property becomes a compact comparison card
- Touch targets remain at least 44px
- Long property lists use `.scrollbar-thin` where appropriate

## 9. Add helper functions for calculations

Add reusable calculation helpers for:

- Annual income from saved worksheet state
- Annual expenses from saved worksheet state
- Net annual cashflow
- Rental yield
- Marginal tax rate estimate
- Estimated negative gearing benefit
- Ownership/loss allocation logic

Avoid putting calculation logic directly inside JSX.

## 10. Update export behaviour

Update export so it supports the current selected view:

- **Detail view** exports the existing detailed worksheet summary.
- **Overall view** exports one row per property plus portfolio annual totals.

The export should not include monthly cashflow or cashflow yield in the Overall view.

## 11. Add tests

Add focused tests for:

- Switching between Detail view and Overall view
- Overall view lists multiple portfolio properties
- Saved cashflow records are used for each property/year
- Properties without saved worksheets show a prompt/empty state
- Negative annual cashflow generates an estimated tax benefit
- Partner income changes the allocation/estimate
- Overall view does not show monthly cashflow
- Overall view does not show cashflow yield
- Existing detail worksheet and document upload tests still pass

## Technical notes

Likely files to update:

```text
src/pages/CashflowTracker.tsx
src/lib/cashflowManager.ts
src/pages/cashflow-docs.test.tsx
```

Potentially add a focused test file if the overview tests become large:

```text
src/pages/cashflow-overview.test.tsx
```

Data sources:

- Portfolio properties from existing localStorage-backed portfolio state
- Saved cashflow records from `property-cashflow-records`
- Active scenario from the existing scenario manager logic
- Household income/tax estimate settings from a new localStorage key, for example:

```text
cashflow-tax-settings
```

Important exclusions for this implementation:

- No monthly cashflow figures in Overall view
- No monthly after-tax impact in Overall view
- No cashflow yield in Overall view
- No backend storage
- No Supabase changes
- No tax advice wording beyond clear estimate/caveat copy
