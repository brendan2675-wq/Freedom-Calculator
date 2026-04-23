
Implement a cleaner Cashflow Tracker control hierarchy by combining the duplicated header/context controls into two clear page-level areas: **Period & documents** and **Property details**.

## What will change

1. **Move cashflow actions out of the blue header**
   - Remove **Upload invoices / receipts** from the page header.
   - Remove the standalone **Period ended 30th June 2027** pill from the page header.
   - Keep the header focused on page identity only:
     - Back to dashboard
     - Cashflow Tracker title/subtitle
     - User menu

2. **Replace FY dropdown with a Period selector**
   - Remove the separate **FY2027** dropdown from the Property cashflow card.
   - Add a clearer **Period ended** selector in the main cashflow controls.
   - The selector will display user-friendly period labels, for example:
     - `Period ended 30 June 2027`
     - `Period ended 30 June 2026`
   - Internally, these still map to the existing financial year keys:
     - `FY2027`
     - `FY2026`
   - Limit the selectable years for now to the current/new-tool range:
     - FY2027 / period ended 30 June 2027
     - FY2026 / period ended 30 June 2026

3. **Move upload into the page controls**
   - Add **Upload invoices / receipts** beside the period selector in the page content area.
   - Keep the existing upload behaviour for now:
     - Allows multiple files
     - Accepts images, PDFs, CSVs, Excel files
     - Shows the current prototype toast that scanning will populate totals in a future release
   - This makes upload feel like a cashflow-period action, not a global header action.

4. **Combine property selection into the Property details tile**
   - Remove the standalone **Select property** dropdown from the Property cashflow card.
   - Make the **Property details tile** the main property context control.
   - Add a compact property selector inside the tile header so users can:
     - Switch between existing properties directly from the tile
     - Start a new property from the same control area
   - Keep the whole tile clickable for editing property details.
   - Ensure the selector does not accidentally open the details sheet when users are only changing property.

5. **Simplify the Property cashflow card**
   - Rework the current card so it no longer duplicates property and FY controls.
   - It should become a compact cashflow context/status area showing:
     - Scenario name
     - Selected period
     - Autosave status
     - Copy to another year/action, if still useful
   - Rename **Copy to another year** if needed so it aligns with period language, for example:
     - `Copy to another period`

6. **Keep property detail editing intact**
   - The Property details tile still opens the side sheet.
   - The side sheet still supports:
     - Use existing
     - Add new
     - Edit property nickname/address/ownership/loan/rent details
   - The new tile-level selector becomes the fast switcher; the sheet remains the detailed editor.

## Proposed page structure

```text
Header
--------------------------------------------------
Cashflow Tracker
Track your properties on-going expenses and income


Main page
--------------------------------------------------
Scenario context banner

Cashflow controls
[Period ended 30 June 2027 v] [Upload invoices / receipts]
Scenario: Sam Client Base Plan
Autosaved 2:14 PM

Property details tile
[Property: New property v] [New property]
Rental income | Total expenses | Yearly cashflow
Ownership tag

Loan amount tile
Interest rate tile
Weekly rent tile

Monthly cashflow worksheet
```

## Technical implementation

- Update `src/pages/CashflowTracker.tsx`.
- Add a small financial-period configuration array, for example:
  - `{ financialYear: "FY2027", label: "Period ended 30 June 2027" }`
  - `{ financialYear: "FY2026", label: "Period ended 30 June 2026" }`
- Use that array for:
  - Period selector display
  - Loading/saving cashflow records by financial year
  - The worksheet context label
- Remove the header upload and period JSX.
- Move upload JSX into the main page controls.
- Remove the standalone property selector from the Property cashflow card.
- Add a property selector inside the Property details tile.
- Add a **New property** action in or beside the property tile selector.
- Update the period change handler to keep the existing behaviour:
  - Update `financialYear`
  - Update `cashflowContext`
  - Load saved cashflow for the selected property/period if it exists
  - Otherwise keep/prefill property data appropriately
- Update `saveAsNewYear` naming and prompts to period-based wording.
- Keep autosave unchanged, but ensure it saves under the selected period.
- Run a build after implementation.

## Expected result

The Cashflow Tracker will feel less repetitive and more hierarchical:

- Header = page title only.
- Period and upload = cashflow-period controls.
- Property details tile = property selection and property editing.
- FY selection is replaced by a clearer period-ended selector.
- Users can switch properties quickly from the tile and review prior periods without separate duplicated controls.
