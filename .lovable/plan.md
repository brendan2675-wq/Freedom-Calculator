
Update the main property summary tile on the Cashflow Tracker so it follows the sketch layout more clearly and uses a cleaner 3-column structure.

## Layout changes

Rework the property tile in `src/pages/CashflowTracker.tsx` into three aligned columns.

### Top control row

Place the controls into the same column rhythm as the metrics:

```text
[ Property name ] [ Select property dropdown ] [ New property button ]
```

This means:

- the property dropdown will line up with the metrics column beneath it
- the new property button will line up with the next metrics column
- the controls will feel intentionally placed instead of floating on the right

On mobile, this will collapse into a single-column stacked layout so the controls remain easy to tap.

## Metric rows

Reorder the summary metrics to match the sketch:

```text
[ Interest rate ]      [ Weekly rent ]       [ Total expenses ]
[ Total loan amount ]  [ Rental income ]     [ Yearly cashflow ]
```

This is a clearer grouping because:

- rate/rent/expenses are the operating assumptions
- loan/income/cashflow are the resulting financial outputs

The existing values and calculations will not change.

## Bottom tag row

Replace the current single ownership pill with a full tag row:

```text
[ Personal / Trust ]   [ Bank: ... ]   [ Property Manager: ... ]
```

Implementation detail:

- ownership tag remains based on `propertyDetails.ownership` and `propertyDetails.trustName`
- bank tag uses `propertyDetails.bank`
- property manager tag uses `propertyDetails.manager`
- if Bank or Property Manager are blank, show a muted placeholder such as:

```text
Bank: Not set
Property Manager: Not set
```

This keeps the row visually balanced and prompts the user to complete the details.

## Styling approach

Use the existing Atelier Wealth styling:

- rounded pill tags
- muted background for secondary tags
- orange accent icons where already used
- consistent `border-t` separator above the bottom tags
- minimum 44px tap targets for dropdown and button
- no new colours or design system changes

## Preserve existing behaviour

No changes to:

- property linking logic
- new property creation logic
- cashflow calculations
- autosave
- FY Docs tile
- Utilities & Charges tile
- export/copy functionality

## Expected result

The property tile becomes:

```text
[ St Kilda ]           [ St Kilda dropdown ]       [ + New property ]

[ Interest rate ]      [ Weekly rent ]             [ Total expenses ]
[ 6.25% ]              [ $0 ]                       [ $71,760 ]

[ Total loan amount ]  [ Rental income ]           [ Yearly cashflow ]
[ $1,148,227 ]         [ $0 ]                       [ $71,760 ]

[ Personal ]           [ Bank: Not set ]            [ Property Manager: Not set ]
```
