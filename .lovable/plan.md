
Implement the Cashflow worksheet responsive table changes, including desktop fit, sticky key columns, and both top and bottom horizontal scrolling.

## What will change

1. **Fit July to June on desktop**
   - Replace the current wide `min-w-[1400px]` table with responsive table sizing.
   - Use compact month columns and narrower monthly inputs so all 12 months, plus Total and Remove, can fit at desktop widths like the current preview.
   - Keep the month headers readable by using shorter padding and compact button styling.

2. **Freeze important columns**
   - Keep **Cashflow item** sticky on the left.
   - Make **Total** sticky on the right, immediately before Remove.
   - Make **Remove** sticky on the far right.
   - Apply this consistently to:
     - Header row
     - Editable cashflow rows
     - Summary rows

3. **Add top and bottom horizontal scrolling**
   - Add a synchronized top horizontal scrollbar above the worksheet.
   - Keep the existing bottom horizontal scrollbar on the table container.
   - Synchronize both scroll positions so dragging either scrollbar moves the same table.
   - Use React refs and a small `onScroll` guard to avoid scroll event loops.

4. **Mobile and tablet behaviour**
   - Preserve horizontal scrolling on smaller screens instead of forcing 12 months into an unreadable layout.
   - Keep the sticky left item column and sticky Total/Remove columns active on mobile where practical.
   - Reduce sticky column widths on mobile so the visible month area is not overly cramped.
   - Ensure touch targets remain at least 44px for editable inputs and delete buttons, matching the project mobile rule.

5. **Visual polish**
   - Use solid `bg-card` / `bg-muted` backgrounds on sticky cells so content does not bleed through while scrolling.
   - Add subtle left/right shadows on sticky columns to show they are fixed.
   - Keep active-month highlighting intact.
   - Keep the `scrollbar-thin` style for both scroll areas.

## Technical implementation

- Update `src/pages/CashflowTracker.tsx`.
- Add refs for the top scrollbar, bottom table scroll container, and table width spacer.
- Add a scroll synchronization handler.
- Update table sizing classes:
  - Desktop: compact fixed-style layout that fits the year.
  - Mobile/tablet: sensible minimum width with horizontal scroll fallback.
- Reduce month header/input sizing from the current wide `w-24` pattern.
- Add right sticky offsets for:
  - Remove column: `right-0`
  - Total column: offset by the Remove column width
- Update `SummaryRow` to support sticky Total and Remove cells.
- Run a build after implementation to confirm the Cashflow page compiles.

## Expected result

On desktop, the worksheet shows the full financial year from **July to June** in one view, with **Total** and **Remove** always visible. On mobile and tablet, the worksheet remains usable with synchronized top and bottom horizontal scrolling and sticky key columns.
