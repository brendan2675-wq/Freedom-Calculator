
Update the Cashflow Tracker header layout as planned, but rename the compact “Period” tile to better capture both the financial year selection and document upload function.

## Recommended tile name

Use:

```text
FY & Docs
```

## Why

`FY & Docs` is short enough to fit the narrower tile, but still communicates both key actions:

- selecting the financial year / tax period
- uploading invoices, receipts, and related documents

It is punchier than `Period & Documents` and more descriptive than just `Period`.

## Other naming options considered

```text
Tax Year & Docs
```

Clear, but may wrap or feel too long in the compact tile.

```text
FY Documents
```

Compact, but sounds more like a document archive than a period selector.

```text
Tax Docs
```

Very short, but underplays the financial year selector.

```text
Year & Docs
```

Simple, but less precise than `FY & Docs`.

## Updated implementation plan

### 1. Change the header grid sizing

Update the Cashflow header grid so the top tiles align as:

```text
Property details       Utilities & Charges   FY & Docs
2 columns wide         1 column wide         1 column wide
```

Technically, keep the existing 8-column grid and use:

```text
Property details:       xl:col-span-4
Utilities & Charges:    xl:col-span-2
FY & Docs:              xl:col-span-2
```

### 2. Set the tile order

Use this order:

```text
Property details | Utilities & Charges | FY & Docs
```

This keeps the charge inputs near the property summary and places the compact financial-year/document controls on the right.

### 3. Rename the Period tile

Change the tile heading from:

```text
Period & documents
```

to:

```text
FY & Docs
```

Keep the calendar/upload-related visual treatment compact.

### 4. Shorten the dropdown labels

Change the financial year dropdown labels from:

```text
Period ended 30 June 2027
Period ended 30 June 2026
```

to:

```text
FY 2027
FY 2026
```

### 5. Shorten the upload button

Change:

```text
Upload invoices / receipts
```

to:

```text
Upload docs
```

Keep the upload icon.

### 6. Tighten the status and action labels

Change:

```text
Autosave ready
Copy to another period
```

to:

```text
Saved
Copy FY
```

If autosave has multiple states, map them as:

```text
Autosave ready  → Saved
Saving...       → Saving...
Unsaved changes → Unsaved
```

### 7. Keep Utilities & Charges one-column wide

Keep the `Utilities & Charges` tile one column wide and prevent dropdown overflow by using a compact stacked row layout:

```text
Council rates
$ [ amount ]     [ Annual ]
```

Apply the same pattern to:

```text
Insurance
Land tax
Water charges
```

Keep the `+ Add` button for extra custom charges.

### 8. Preserve functionality

No calculation or data behaviour changes:

- Council rates, Insurance, Land tax, and Water charges remain Cashflow-period-specific.
- `+ Add` still adds a custom expense row.
- Upload still accepts the same document types.
- Financial year switching still uses the same state.
- Copy functionality still copies the current financial year’s cashflow data.
- No valuation fields are added.

## Expected result

The header becomes:

```text
[ Property details - 2 columns ] [ Utilities & Charges - 1 column ] [ FY & Docs - 1 column ]
```

The compact right tile becomes:

```text
FY & Docs
FY 2027
Upload docs
Saved
Copy FY
```

This should fix the overflow while keeping the document upload purpose visible.
