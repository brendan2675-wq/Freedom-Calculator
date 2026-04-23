
## Plan: Move Google Drive and OneDrive into an “Upload docs” source picker

### Goal
Change the FY Docs upload flow so the main tile shows a single **Upload docs** button. When clicked, users see a clear source picker with options for:

- Upload from computer/device
- Upload from phone/camera/files
- Google Drive — coming soon
- OneDrive — coming soon

The cloud options remain UI placeholders only for now.

### Best-practice pattern to follow
Use a single primary upload CTA, then reveal upload sources in a modal or bottom-sheet style picker. This is the common pattern used by document apps because it:

- avoids cluttering the tile with multiple upload buttons
- makes the user’s first choice simple: “Upload docs”
- groups all upload sources in one predictable place
- keeps future cloud integrations easy to add without redesigning the tile
- works well on mobile, where source options should appear in a sheet-like picker with large touch targets

Google Drive and OneDrive’s own picker patterns also support this approach: the app opens a picker experience only after the user chooses that provider.

### What will change

1. Replace the current inline cloud buttons
- Remove Google Drive and OneDrive buttons from the FY Docs tile.
- Keep the tile visually compact with one primary **Upload docs** button.
- Existing selected/review document list stays below the button.

2. Add an upload source picker
Clicking **Upload docs** will open a dialog/sheet titled something like:

```text
Choose document source
```

It will show source cards/buttons:

```text
Computer or device
Upload PDFs, images, spreadsheets or receipts from this device

Phone camera or files
Take a photo of a receipt/bill or choose a file from your phone

Google Drive
Coming soon — cloud import will be connected later

OneDrive
Coming soon — cloud import will be connected later
```

3. Keep local uploads functional
- **Computer or device** will trigger the existing multi-file input.
- Accepted files remain:
  - images
  - PDF
  - CSV
  - Excel files
- Multiple files can still be selected at once.
- Files still create in-memory review rows only.
- File input will still be cleared after selection so the same document can be selected again.

4. Add phone-friendly upload option
- **Phone camera or files** will use a second file input optimised for mobile.
- It can accept images and PDFs.
- Where supported by the browser/device, this can allow camera/photo capture or phone file selection.
- On desktop, it will still behave safely as a normal file picker.

5. Keep cloud placeholders only
- Google Drive and OneDrive will appear in the picker as disabled/coming-soon style options or clickable placeholder cards.
- Clicking either will show the existing toast-style message:
  - “Google Drive import will be connected with the backend cloud auth work.”
  - “OneDrive import will be connected with the backend cloud auth work.”
- No OAuth, cloud API calls, tokens, backend routes, or connector setup will be added.

6. Update tests
Update the FY Docs tests so they verify:

- clicking **Upload docs** opens the source picker
- local upload still creates review rows
- multiple document upload still works
- Google Drive placeholder appears inside the picker
- OneDrive placeholder appears inside the picker
- clicking cloud placeholders shows the coming-soon toast
- document files are still not persisted to localStorage

### Files likely to change

```text
src/pages/CashflowTracker.tsx
src/pages/cashflow-docs.test.tsx
```

Potentially add a small component if the picker markup becomes too large:

```text
src/components/FyDocsUploadSourceDialog.tsx
```

### Safety and privacy
This remains frontend-only:

- no document retention
- no localStorage document storage
- no Supabase upload/storage
- no raw OCR text persistence
- no cloud authentication yet
- only reviewed cashflow values are saved through the existing cashflow state
