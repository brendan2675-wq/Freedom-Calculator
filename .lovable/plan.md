

## UX Improvements 1-4 for PPOR Goal Page

### 1. Consolidate PPOR Entry Points (Make Main Card Display-Only)

**Current problem**: Loan balance and interest rate are editable directly on the main card AND in the PPOR Detail Sheet -- two places to edit the same data.

**Changes in `src/components/KeyInputs.tsx`**:
- Replace the loan balance `<input>` (line 119-128) and interest rate `<input>` (line 131-148) with display-only formatted text
- Style them as read-only values with a subtle "edit in sheet" affordance
- Make the entire "Loan to Pay Down" section clickable to open the PPOR Detail Sheet (similar to how Progress Tracker opens its sheet)
- Add a ChevronRight icon and hover state to signal it's tappable
- Keep the sell-down proceeds breakdown as display-only (it already is)

### 2. Show Time Saved on Paydown Chart

**Current problem**: The chart shows two lines but never explicitly states the payoff difference.

**Changes in `src/components/PaydownChart.tsx`**:
- Add a `useMemo` that finds the year each line (standard vs accelerated) hits zero balance
- Compute the difference in years
- Display a callout banner below the chart title when sell-downs exist, e.g.: "Without sell-down: 28 years. With sell-down: 9 years. **You save 19 years.**"
- Style with accent colors and a Clock icon for visual emphasis
- Only show when `hasSellDowns` is true

### 3. Fix Static "Update" Warning Badge

**Current problem**: The "Update" badge on "Loan to Pay Down" (line 111-114) is always visible regardless of user activity.

**Changes in `src/components/KeyInputs.tsx`**:
- Track last-updated timestamp in localStorage when loan balance or interest rate changes (key: `ppor-loan-last-updated`)
- Show the "Update" badge only when the last update was more than 90 days ago (or never set)
- Display relative time: "Updated 3 months ago" or "Not yet updated"
- Remove the badge entirely if updated recently

### 4. Bridge Between Sell-Down Properties and Chart

**Current problem**: No visual connection between the properties listed below and the paydown chart above.

**Changes in `src/components/KeyInputs.tsx`**:
- Add a summary line between the chart card and the Existing Properties section
- Use `sellDownEvents` data to show: "{N} properties earmarked -> ${X} net proceeds"
- Include a downward arrow icon to visually bridge chart and property list
- Only display when there are sell-down events
- Style as a compact, centered connector element

---

### Files Modified

| File | Changes |
|------|---------|
| `src/components/KeyInputs.tsx` | Make loan inputs display-only, fix Update badge with time-based logic, add sell-down bridge summary |
| `src/components/PaydownChart.tsx` | Add "time saved" callout comparing standard vs accelerated payoff years |

