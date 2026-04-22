
Implement the Cashflow property details tile simplification, excluding bank/lender from the tile because that belongs in the interest rate details tile.

## Changes to make

1. **Make the whole property details tile the sidebar trigger**
   - Keep the entire Cashflow property details tile clickable.
   - Clicking anywhere on the tile opens the existing property details sidebar.
   - Preserve the current sidebar workflow:
     - Use existing property
     - Add new property
     - Edit property nickname
     - Optional address search
     - Property type
     - Personal / Trust ownership

2. **Remove the address fallback**
   - Remove the current “No address added” fallback text.
   - If an address exists, it can remain secondary and subtle.
   - If no address exists, show nothing instead of placeholder copy.
   - The property nickname becomes the main identity for the tile.

3. **Match Portfolio / PPOR property tile pattern**
   - Use the existing `InvestmentTypeIcon` as the primary visual identifier.
   - Use the same clean property-card style language:
     - `border-2`
     - `rounded-xl`
     - `bg-card`
     - accent hover border
     - subtle hover/active state
   - Avoid a form-summary look; make it feel like a property card.

4. **Simplify visible metadata**
   - Show:
     - Property nickname
     - Property type icon
     - Optional property type label if useful for clarity
     - Ownership structure:
       - `Personal`
       - Trust name when ownership is Trust
   - Do not show:
     - “No address added”
     - Bank/lender
     - Empty placeholders such as `—`

5. **Move bank/lender out of this tile**
   - Do not display bank/lender in the Cashflow property details tile.
   - Leave bank/lender information to be handled in the interest rate / loan details tile instead.

## Technical implementation

- Update `src/pages/CashflowTracker.tsx`.
- Refactor the current property details button/card rendering.
- Reuse existing imports and helpers:
  - `InvestmentTypeIcon`
  - `getInvestmentTypeLabel`
  - `openPropertyDetailsSheet("current")`
- Keep the existing property details data model and sidebar state intact.
- Only adjust the tile presentation and conditional rendering.
- After implementation, run a build to confirm the Cashflow page compiles successfully.
