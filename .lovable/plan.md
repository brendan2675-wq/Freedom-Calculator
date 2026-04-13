

# Mobile Optimization Fixes

## Issues Found

1. **Portfolio page header overlap**: On mobile (390px), the page title ("Your Portfolio"), the Reset button, and the "Atelier Wealth" + client name section all sit in a single row, causing text to clip ("Atelier W...", "Client N...") and overlap.

2. **Property card badge text clipping**: On narrow property cards, the "Personal" badge gets cut off to "Persona" because the card width constrains the badge area.

3. **"No date set" badge on PropertiesToBuy cards**: Similarly clips on narrow mobile viewports.

## Plan

### 1. Fix Portfolio page header for mobile
**File: `src/pages/Portfolio.tsx` (lines 132-181)**
- Stack the header vertically on mobile: title/subtitle on top, branding/client on a second row
- Use `flex-col sm:flex-row` for the main header container
- Reduce title font size slightly on very small screens
- Move the Reset button inline with the branding row on mobile

### 2. Fix badge clipping on property cards
**File: `src/components/ExistingProperties.tsx` (lines 362-368)**
- Add `truncate` or `whitespace-nowrap` and ensure the badge container doesn't force text to clip
- Reduce badge font size to `text-[10px]` on very narrow cards, or allow the flex container to wrap properly

### 3. Fix "No date set" badge clipping on future property cards
**File: `src/components/PropertiesToBuy.tsx`**
- Apply the same truncation/sizing fix to timeline badges

These are targeted CSS/layout adjustments — no logic changes needed.

