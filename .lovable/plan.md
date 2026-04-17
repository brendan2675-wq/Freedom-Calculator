
The previous plan has already been approved and implemented. The user's "Approved" message with the choices (6.50% interest rate, 3-step cards, auto-clear) was already actioned in the last edit.

Looking at the diff, only `EmptyStateCard.tsx` is shown, but the summary confirms `App.tsx`, `Home.tsx`, `Index.tsx`, `Portfolio.tsx`, and `portfolioDefaults.ts` were also updated. However, one detail differs from the approved choices: the interest rate default was set to **6.0%** instead of the requested **6.50%**.

## Goal
Apply the user's explicit choice of **6.50%** interest rate default (currently set to 6.0% in the implementation).

## Investigation
Need to confirm where the interest rate default lives — likely in `src/pages/Index.tsx` and/or `src/pages/Portfolio.tsx` `useState` initialisers, plus possibly the `PporDetailSheet` reset logic.

## Plan

### Update interest rate default to 6.50%
- **`src/pages/Index.tsx`**: Find the PPOR `interestRate` initialiser and change `6.0` → `6.5`.
- **`src/pages/Portfolio.tsx`**: Same change in the PPOR state initialiser.
- **`src/components/PporDetailSheet.tsx`** (if it has its own default): Update any fallback/reset value to `6.5`.
- Also check investment property "Add Property" defaults — leave those untouched unless they currently default to 6.0% as well, in which case align them to 6.5% for consistency.

### Verification
After the edit, fresh users (cleared localStorage) should see **6.50%** pre-filled in the PPOR interest rate field and any new investment property they add.

## Files touched
- `src/pages/Index.tsx`
- `src/pages/Portfolio.tsx`
- `src/components/PporDetailSheet.tsx` (if applicable)

That's the only delta. Everything else in the original plan is already live.
