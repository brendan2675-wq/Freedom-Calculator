
Implement the Cashflow Tracker cleanup using Portfolio and PPOR as the lead source of truth, excluding the Valuation fields section.

## Scope

Do everything from the previous review except:

- Do not add Estimated Value to Cashflow.
- Do not add PPOR Purchase Price, Current Value, or Original Loan Amount to Cashflow.
- Do not introduce a new Valuation section in the Cashflow sidebar.

## Implementation plan

### 1. Make linked Portfolio / PPOR property data the source of truth

Update `src/pages/CashflowTracker.tsx` so linked Cashflow properties resolve from the live Portfolio records:

- PPOR source: `portfolio-ppor`
- Investment / SMSF source: `portfolio-properties`

Add helper functions inside Cashflow Tracker:

```ts
getLinkedProperty()
updateLinkedProperty()
getLinkedLoanBalance()
getLinkedInterestRate()
syncPropertyDetailsFromLinkedProperty()
```

These will stop Cashflow relying on stale copied values when a property is linked.

Shared fields will be pulled from the linked property whenever a property is selected or refreshed.

### 2. Replace Cashflow-only loan amount with the Portfolio / PPOR split-loan pattern

Remove the standalone editable `Total Loan Amount` field from the Cashflow sidebar.

Replace it with the same pattern used in `PropertyDetailSheet.tsx` and `PporDetailSheet.tsx`:

```text
Current Loan Balance
$1,200,000
Click to set up loan details →
```

Then show the split-loan editor:

```text
Loan Details
Label | Amt ($) | Rate (%) | IO | Term (yr) | Offset ($) | Remove
+ add split
```

Behaviour:

- If no loan splits exist:
  - Clicking Current Loan Balance creates the first split using the current `loanBalance`.
- If splits exist:
  - Current Loan Balance is calculated from the split amounts.
  - Clicking it focuses/highlights the first split amount field.
- Split amount edits update `loanSplits`.
- `loanBalance` is recalculated from:
  ```ts
  loanSplits.reduce((sum, split) => sum + (split.amount || 0), 0)
  ```
- Interest rates allow two decimal places.
- Do not flatten splits into one amount.
- Do not zero out secondary splits.

### 3. Remove bad sync logic that overwrites split loans

Replace the current Cashflow sync behaviour that does this:

```ts
split 1 = total loan amount
all other splits = 0
```

with:

```ts
loanSplits = preserve and update actual split rows
loanBalance = sum of loanSplits
```

Only update `loanBalance` directly when no split loans exist.

This applies to:

- `syncLinkedPortfolioProperty`
- `savePropertyDetailsFromSheet`
- Property selection/loading logic
- Any Cashflow property update that writes back to Portfolio or PPOR

### 4. Sync shared property identity fields directly

The Cashflow sidebar fields should update the linked Portfolio / PPOR property:

```text
Property nickname
Full address
Investment type
Ownership structure
Trust name
```

Expected behaviour:

- Editing these fields in Cashflow updates the same linked property.
- The top Property details tile updates immediately.
- The sidebar selected property stays aligned with the top tile.
- The Portfolio / PPOR sidebar shows the same values when opened later.

### 5. Sync loan and rental fields directly

The Cashflow sidebar should update the linked property for:

```text
Loan splits
Current loan balance
Interest rate
Lender / Bank
Weekly rent
```

Rules:

- `Weekly Rent` writes to `property.rental.weeklyRent`.
- `Lender / Bank` writes to `property.loan.lenderName`.
- Interest rate writes to the linked property loan data and/or split rows using the same pattern as Portfolio / PPOR.
- The top summary tile displays:
  - Total loan amount from split total when splits exist
  - Interest rate with two decimals
  - Weekly rent with `$` formatting
- The worksheet rental income row recalculates from weekly rent:
  ```ts
  weeklyRent * 52 / 12
  ```
- The worksheet interest row recalculates from linked loan balance and interest rate.

### 6. Keep Cashflow-only fields separate

These fields stay Cashflow-period-specific and should not sync back to Portfolio / PPOR:

```text
Financial year / period
Uploaded invoices / receipts
Autosave status
Copy to another period
Monthly cashflow worksheet rows
Council rates
Insurance
Land tax
Water charges
Custom income rows
Custom expense rows
Property Manager
```

`Property Manager` remains Cashflow-only for now because the shared Portfolio / PPOR property type does not currently have a matching field.

### 7. Remove separate Owner handling where it conflicts

Cashflow should stop treating `owner` as an independent property field.

Display ownership from the shared Portfolio / PPOR structure:

```ts
ownership === "trust" ? trustName : "Personal"
```

This avoids Cashflow showing a different owner from Portfolio / PPOR.

### 8. Standardise formatting

Make the Cashflow tile, sidebar, and export use the same formatting style as Portfolio / PPOR:

```text
Currency:      $1,234,567
Weekly rent:   $650
Interest rate: 6.20%
Loan balance:  $1,200,000
```

Specific fixes:

- Interest rate should always display with two decimal places.
- Currency values should include `$` and comma separators.
- Split-loan fields should use the same compact row pattern and spacing as Portfolio / PPOR.
- Top tile values should match the sidebar and linked source property.

### 9. Update export summary

The Cashflow export should use synced linked-property values for:

```text
Owner / ownership
Address
Bank
Loan Amount
Interest Rate
Weekly Rent
```

Interest rate should export as:

```text
6.20%
```

not:

```text
6.2%
```

### 10. Verification after implementation

After the code changes:

- Run the build.
- Check that selecting a property in Cashflow loads the same shared fields as Portfolio / PPOR.
- Check that editing Cashflow loan splits updates the linked Portfolio / PPOR property.
- Check that editing weekly rent updates the Cashflow worksheet rental income row.
- Check that interest expense recalculates from the linked loan balance and rate.
- Check that opening the same property in Portfolio / PPOR shows the same split loans, rent, lender, ownership, and address.
- Check that period-specific Cashflow rows remain separate by financial year.
- Confirm no Valuation fields were added to Cashflow.

## Expected result

Cashflow will no longer have a separate property-entry model.

The shared property fields will follow the same source and pattern everywhere:

```text
Portfolio investment sidebar
PPOR sidebar
Cashflow sidebar
```

Cashflow will only manage the actual period-based worksheet and documents, while Portfolio / PPOR remain the lead source for property identity, ownership, loan, lender, and rental details.
