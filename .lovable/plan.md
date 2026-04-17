
## Goal
Remove seeded test properties (Parramatta, Liverpool, default PPOR values) so new users land on a clean slate, and replace emptiness with welcoming, actionable empty states across Home, PPOR Goal and Portfolio pages.

## Investigation summary
- `src/App.tsx` seeds `portfolio-properties` with Parramatta + Liverpool on first load and runs a `normalizeExistingProperties` migration — this is the main source of test data.
- `src/lib/portfolioDefaults.ts` only exists to backfill purchase prices for those seeded IDs.
- `src/pages/Index.tsx` (PPOR Goal) and `src/pages/Portfolio.tsx` likely seed default PPOR values (suburb, current value, loan balance) via `useState` initialisers — need to clear.
- `src/pages/Home.tsx` is the dashboard — currently assumes data exists.
- An onboarding toast flow already exists (`mem://features/onboarding-experience`) — extendable.
- Saved scenarios are stored separately under `saved-scenarios` and will be preserved.

## Plan

### 1. Strip seed data
- **`src/App.tsx`**: Remove the `if (!storedPortfolio) { … defaults … }` block and the `normalizeExistingProperties` migration. New users start with `portfolio-properties = []`.
- **`src/lib/portfolioDefaults.ts`**: Delete file and remove its import from `App.tsx`.
- **`src/pages/Index.tsx`** & **`src/pages/Portfolio.tsx`**: Default PPOR fields (suburb, estimated value, loan balance, purchase price) to empty strings / 0. Keep interest rate at a neutral **6.00%** default since it's a market input rather than personal data. Keep target year/month at sensible defaults (10 years out).
- **One-time cleanup for existing testers**: On app load, if `portfolio-properties` contains exactly the two seeded IDs `"1"` (Parramatta) and `"2"` (Liverpool) with their original nicknames, clear them. This catches existing testers without nuking real user data. Gate behind a `seed-cleanup-v1` flag in localStorage so it only runs once.

### 2. Reusable empty-state component
Create **`src/components/EmptyStateCard.tsx`** — icon + headline + sub + CTA button. Reused on all three pages for visual consistency.

### 3. Dashboard (Home) empty state
When both PPOR has no value AND portfolio is empty, replace the summary tiles with a centered welcome panel:
- Headline: "Welcome to Atelier Wealth"
- Sub: "Build your property strategy in three steps"
- Three numbered step cards with icons:
  1. **Add your home** → CTA → `/ppor-goal`
  2. **Add your investment properties** → CTA → `/portfolio`
  3. **Set your payoff goal** → CTA → `/ppor-goal`
- Partial states: completed steps show a tick; remaining steps still prompt.

### 4. PPOR Goal page empty state
- When PPOR `estimatedValue === 0`: replace the metric mini-cards with a full-width prompt "Add your owner-occupied home to begin" + "Set up PPOR" button that opens the existing `PporDetailSheet` directly.
- Investment list: when empty, show a friendly "No investment properties yet — add your first to model the paydown strategy" card with the existing Add CTA.
- Charts/projections: render a muted placeholder ("Your projection will appear here once you add your home and at least one investment") instead of a flat-line chart.

### 5. Portfolio page empty state
- Existing Properties ribbon: when empty, show a single 180px "Add your first investment property" card matching ribbon dimensions, with icon + CTA opening the Add flow.
- Proposed Purchases & Sold Properties: keep their current empty states.
- Portfolio metrics summary bar: show "—" placeholders with sub-text "Add properties to see aggregate metrics" when empty.

### 6. Onboarding tweak
Extend the first-load toast sequence: after disclaimer + tip, add a third toast "Start by adding your home on the PPOR Goal page" with a clickable action that navigates to `/ppor-goal`. Only fires when both PPOR and portfolio are empty, so returning users aren't nagged.

## Files touched
- `src/App.tsx` — remove seed block, add one-time cleanup
- `src/lib/portfolioDefaults.ts` — delete
- `src/pages/Home.tsx` — welcome empty state
- `src/pages/Index.tsx` — clear PPOR defaults, empty states, placeholder chart
- `src/pages/Portfolio.tsx` — clear defaults, ribbon empty state, placeholder metrics
- `src/components/EmptyStateCard.tsx` — new reusable component
- `src/components/Disclaimer.tsx` (or wherever onboarding toasts live) — add third toast

## Open question
One quick decision before building — answer below and I'll implement:

**Dashboard empty state style:** 3-step guided cards (Add home → Add investments → Set goal), or a simpler single hero "Get started" CTA, or a hero + smaller supporting steps below? Default if you don't reply: **3-step guided cards**.
