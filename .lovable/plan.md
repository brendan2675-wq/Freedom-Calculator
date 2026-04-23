
## Plan: FY Docs upload UI with cloud-service placeholders

### Scope
Implement the FY Docs frontend workflow only. Uploaded documents will not be retained, and there will be no backend/Supabase extraction integration in this step.

### What will be built

1. Replace the current prototype upload toast
- Keep the existing multi-file device upload input.
- Change the behaviour from “future release” toast to an in-memory import flow.
- Show selected files inside the FY Docs tile with basic statuses such as:
  - Ready for review
  - Needs backend extraction
  - Unsupported file type
- Clear the file input after selection so users can reselect the same file if needed.

2. Add cloud-service placeholders
- Add disabled/placeholder buttons for:
  - Google Drive
  - OneDrive
- These will be clearly labelled as “coming soon” or “backend required”.
- Clicking them can show a short toast explaining that cloud import will be connected later by the backend/cloud auth work.
- No OAuth, connectors, tokens, or cloud API calls will be added.

3. Add a review/apply UI scaffold
- Add a review dialog or drawer for document-derived cashflow items.
- For now, because there is no backend extraction, uploaded files will create review rows that need manual completion.
- The review row fields will support the future backend response shape:
  - File name
  - Supplier
  - Month
  - Category
  - Amount
  - Recurring yes/no
  - Frequency

4. Add frontend extraction contract
- Add a small typed model, likely in `src/lib/documentExtraction.ts`, for the backend developer to connect later.
- The frontend will expect future extracted items in a stable shape, for example:

```ts
type ExtractedCashflowItem = {
  id: string;
  fileName: string;
  supplier?: string;
  monthIndex?: number;
  amount?: number;
  category:
    | "council"
    | "insurance"
    | "land-tax"
    | "water"
    | "repairs"
    | "body-corporate"
    | "legal"
    | "pest"
    | "cleaning"
    | "gardening"
    | "sundry";
  confidence?: number;
  recurring?: {
    isRecurring: boolean;
    frequency?: "monthly" | "quarterly" | "annual";
  };
  status: "needs-review" | "ready" | "failed";
};
```

5. Apply reviewed items to cashflow
- Once a row has category, month, and amount, the user can apply it.
- One-off items will add into the matching worksheet row/month.
- If the same cell already has a value, the imported amount will be added to the existing value.
- Recurring utility items will update existing Utilities & Charges controls:
  - Council rates
  - Insurance
  - Land tax
  - Water charges
- The existing autosave/localStorage flow will persist only the approved cashflow values, not the source documents.

### Files likely to change
```text
src/pages/CashflowTracker.tsx
src/lib/documentExtraction.ts
```

Potentially add:
```text
src/components/FyDocsReviewDialog.tsx
```

### Safety and privacy
- No uploaded document files will be stored in localStorage.
- No uploaded document files will be stored in Supabase.
- No raw OCR text will be persisted.
- Only user-approved cashflow amounts/categories/months will be saved through the existing cashflow state.

### Testing after implementation
- Select one file and confirm it appears in the FY Docs import list.
- Select multiple files and confirm each is listed.
- Confirm unsupported file handling is clear.
- Confirm Google Drive and OneDrive show as placeholders only.
- Confirm review dialog fields can be edited.
- Confirm applying an item updates the correct cashflow row/month.
- Confirm duplicate row/month imports add to the existing cell.
- Confirm recurring utility imports update the matching utility schedule.
- Confirm uploaded files are not persisted after refresh.
