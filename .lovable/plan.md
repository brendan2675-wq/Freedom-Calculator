

## Master Sell Down Button with Year Selector

### What we're building
A **"Sell Down All"** button in the Existing Properties section header with an adjacent **year dropdown (1–10)**, matching the existing per-property sell-down pattern. Clicking the button earmarks all properties for sell-down at the selected year. If all are already earmarked, it clears them all.

### Changes — single file: `src/components/ExistingProperties.tsx`

1. **Import** `BadgeDollarSign` icon from lucide-react
2. **Add state** for the master sell-down year (default: `0` = now)
3. **Add UI** in the section header (next to scroll arrows):
   - A year `<select>` dropdown with options: "Now", "1 year", "2 years" … "10 years" — same pattern as the individual property sell-down in `PropertyDetailSheet.tsx`
   - A compact button labeled **"Sell Down All"** (or **"Clear Sell Down"** when all are earmarked)
4. **On click**: toggle all properties' `earmarked` flag and set their `sellInYears` to the selected master year value
5. All downstream calculations (CGT, net proceeds, progress tracker) already react to `earmarked` and `sellInYears` — no other files need changes

