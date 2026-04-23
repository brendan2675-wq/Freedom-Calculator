
Implement a more consolidated Cashflow Tracker layout by moving the loan/rent inputs into the Property details tile and placing the period/document/status controls beside it on the same row.

## What will change

1. **Merge loan/rent metric tiles into Property details**
   - Remove the three standalone tiles:
     - Total loan amount
     - Interest rate
     - Weekly rent
   - Add these as compact editable fields inside the existing Property details tile.
   - Keep their current behavior:
     - Updating loan amount recalculates monthly interest.
     - Updating interest rate recalculates monthly interest.
     - Updating weekly rent recalculates rental income and agent fees.
     - Autosave continues to pick up these changes.

2. **Make Property details the main property + key assumptions card**
   - The tile will contain:
     - Property selector
     - New property action
     - Property name/address/ownership
     - Editable key assumptions:
       - Total loan amount
       - Interest rate
       - Weekly rent
     - Summary figures:
       - Rental income
       - Total expenses
       - Yearly cashflow
   - The whole tile will still open the property details sheet when clicked.
   - Inputs/selects inside the tile will stop click propagation so changing values does not accidentally open the side sheet.

3. **Move the Period/Documents/Autosave card to the right**
   - Place the current period/upload/status card to the right of the Property details tile on desktop.
   - This creates one clear top row:
     ```text
     [Property details + key assumptions]  [Period ended + Upload + Scenario + Autosave + Copy]
     ```
   - On desktop, use a two-column grid such as:
     - Property details: larger left column
     - Period/document controls: smaller right column

4. **Mobile and tablet layout**
   - Stack the cards vertically on smaller screens:
     ```text
     Property details
     Period & documents
     Expense controls
     Monthly worksheet
     ```
   - Keep all touch targets at least 44px high.
   - Use compact two-column or single-column layouts inside the Property details tile depending on available width.
   - Ensure the period selector and upload button remain full-width or easy to tap on mobile.

5. **Visual hierarchy**
   - Rename the right-hand card section to something like **Period & documents** or keep it label-free if the controls are self-explanatory.
   - Make the Property details tile visually dominant because it is now the primary context for the worksheet.
   - Use separators inside the property tile to distinguish:
     - Property selection
     - Key assumptions
     - Cashflow summary

## Technical implementation

- Update `src/pages/CashflowTracker.tsx`.
- Replace the current layout:
  ```tsx
  <section className="mb-4 ...">Period/upload/status card</section>
  <section className="grid ...">
    Property details tile
    EditableMetric Total loan amount
    EditableMetric Interest rate
    EditableMetric Weekly rent
  </section>
  ```
  with one combined top grid:
  ```tsx
  <section className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
    Property details tile with embedded assumptions
    Period/documents/status card
  </section>
  ```

- Move the existing period selector, upload button, scenario label, autosave label, and **Copy to another period** action into the right-hand card.
- Move the existing `EditableMetric` logic into a smaller inline component or inline JSX inside the Property details tile.
- The existing `EditableMetric` component can be removed if no longer used.
- Keep the existing functions unchanged where possible:
  - `updateLoanAmount`
  - `updateInterestRate`
  - `updatePropertyWeeklyRent`
  - `handlePeriodChange`
  - `handlePrototypeUpload`
  - `saveAsNewPeriod`
- Add `onClick={(event) => event.stopPropagation()}` / `onKeyDown={(event) => event.stopPropagation()}` around embedded inputs and selectors inside the clickable Property details tile.
- Run a build after implementation to confirm the Cashflow page compiles.

## Expected result

The top of the Cashflow Tracker will be cleaner and less repetitive:

- Property selection, property details, loan amount, interest rate, and weekly rent are all managed in one Property details tile.
- Period, upload, scenario, autosave, and copy-period controls sit beside it as a contextual control card.
- The standalone metric tiles are removed.
- Desktop gets a tighter same-line layout, while mobile remains stacked and easy to use.
