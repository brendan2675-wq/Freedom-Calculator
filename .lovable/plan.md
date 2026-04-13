

# Comprehensive Mobile Optimization & Bug Fix Plan

## Issues Found

### Critical Mobile Layout Issues

1. **Property cards clip on mobile (PPOR Goal page)**: The `cardWidth` is calculated as `calc((100% - 36px) / 4)` regardless of viewport. On a 390px screen, each card is ~85px wide — far too narrow. Text overflows ("Future V...", "$1,327", "$70,0"). Both `ExistingProperties.tsx` and `PropertiesToBuy.tsx` have this issue.

2. **Portfolio summary cards stack into a single column**: `grid-cols-1 md:grid-cols-5` means on mobile, 5 tall cards take up the entire screen. Should be a 2-column or 3-column compact grid on mobile.

3. **Sell-down bridge text overflows on mobile**: The "X properties earmarked → $Y net proceeds" button in `KeyInputs.tsx` uses `whitespace-nowrap` inline text that can overflow on narrow screens.

4. **Scroll arrows positioned at `-left-5` / `-right-5`** on property carousels clip outside the container on mobile where there's no extra margin.

### Moderate Issues

5. **Portfolio page header "Atelier Wealth" / "Client Name" clusters at bottom-right**: On mobile, the branding and reset button sit on a separate row but feel disconnected from the title.

6. **Property card touch targets too small**: The X (remove) button is only 14px, the "Go" sell-down button is tiny at `text-[10px]`, and the LVR dropdown is very small — all below the 44px minimum recommended touch target.

7. **PaydownSummary fixed bar**: The bottom fixed bar with Total Equity / Loan Remaining can overlap mobile browser chrome and cut off content. Not enough bottom padding on the page.

8. **"Sell All in" dropdown/button cluster**: The `flex` layout wrapping the sell-all controls in the ExistingProperties header can overflow on narrow screens.

### Minor Issues

9. **Sell-down event detail rows**: The flex layout showing property name + selling year + progress bar + amount doesn't wrap on narrow screens, causing horizontal scroll in the sell-down bridge.

10. **Sheet/sidebar width**: The `Sheet` component uses Shadcn defaults which are fine, but on very small screens (320px), some input groups in PropertyDetailSheet can feel cramped.

---

## Plan

### 1. Make property cards responsive (single-column on mobile)
**Files: `src/components/ExistingProperties.tsx`, `src/components/PropertiesToBuy.tsx`**

- Change `cardWidth` to be responsive: on screens < 640px, use `calc(100% - 16px)` (nearly full width, one card visible at a time with horizontal scroll) instead of the 4-column calculation
- Add a CSS media query or use a `useIsMobile()` hook to determine card width
- Keep the horizontal scroll container but with `scroll-snap-type: x mandatory` so cards snap to full-width on mobile
- Update `minWidth` from `200px` to a responsive value

### 2. Fix Portfolio summary grid for mobile
**File: `src/pages/Portfolio.tsx`**

- Change `grid-cols-1 md:grid-cols-5` to `grid-cols-2 md:grid-cols-5` so mobile shows a compact 2x3 grid
- Reduce padding from `p-6` to `p-4` on mobile for the summary cards
- Make text sizes responsive (`text-xl` on mobile instead of `text-2xl`)

### 3. Fix scroll arrow positioning on mobile
**Files: `src/components/ExistingProperties.tsx`, `src/components/PropertiesToBuy.tsx`**

- Change `-left-5` / `-right-5` to `left-1` / `right-1` on mobile (or hide arrows on mobile since touch scrolling is native)
- Add `hidden sm:flex` to arrows since mobile users swipe

### 4. Increase touch targets
**Files: `src/components/ExistingProperties.tsx`, `src/components/PropertiesToBuy.tsx`**

- Increase X (remove) button hit area to `min-w-[44px] min-h-[44px]`
- Increase "Go" button padding
- Increase LVR dropdown touch area

### 5. Fix sell-down bridge overflow on mobile
**File: `src/components/KeyInputs.tsx`**

- Allow the sell-down bridge button text to wrap on mobile: replace inline layout with `flex-col` on small screens
- Reduce font size on mobile for the earmarked count text

### 6. Fix "Sell All in" header controls on mobile
**File: `src/components/ExistingProperties.tsx`**

- Wrap the section header to stack title and sell controls vertically on mobile using `flex-col sm:flex-row`

### 7. Add bottom padding for fixed PaydownSummary bar
**File: `src/pages/Index.tsx`**

- Add `pb-20` to the main container to prevent the fixed bottom bar from overlapping content

### 8. Fix sell-down detail rows for mobile
**File: `src/components/KeyInputs.tsx`**

- Make sell-down event rows stack on mobile: property name on top, amount below, hide progress bar on very narrow screens

### 9. Responsive text/spacing throughout
**Files: Multiple**

- Audit and add `text-sm md:text-base`, `p-3 md:p-6` patterns where needed
- Ensure no fixed-width containers cause horizontal scroll

---

## Technical Details

The core fix is the `cardWidth` calculation in both property components. Currently:
```js
const cardWidth = hasOverflow ? "calc((100% - 36px) / 4.3)" : "calc((100% - 36px) / 4)";
```

This will change to use the `useIsMobile()` hook:
```js
const isMobile = useIsMobile();
const cardWidth = isMobile 
  ? "calc(100% - 16px)"  // full-width cards on mobile
  : hasOverflow ? "calc((100% - 36px) / 4.3)" : "calc((100% - 36px) / 4)";
```

For the Portfolio summary cards, the grid change is simple:
```diff
- <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
+ <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
```

