
Update the `FY & Docs` tile so it feels purposeful, removes unnecessary autosave noise, and makes the copy action clearer.

## Recommendation

### 1. Remove the persistent `Saved` label

I agree: `Saved` does not add much value here, especially in a compact tile.

Most modern apps handle autosave like this:

```text
Google Docs: subtle "Saving..." / "Saved to Drive" near document title
Notion: mostly invisible, only shows errors or sync issues
Airtable: no prominent saved label during normal use
Xero/MYOB-style tools: usually confirm after explicit actions, not constant autosave status
```

For this app, the best fit is:

```text
Only show autosave status when something is happening or wrong.
```

So the tile should normally show nothing. If saving is active, briefly show:

```text
Saving...
```

If save fails in future, show an error/toast. Do not show `Saved` permanently.

## 2. Make the copy action explicit

The current `Copy FY` label is too vague, and the behaviour is surprising because it silently copies to the other available year.

Instead of:

```text
Copy FY
```

Use a contextual label:

```text
Copy to FY 2026
```

or, in compact form:

```text
Copy → FY 2026
```

When the current selected year is `FY 2026`, the button should become:

```text
Copy → FY 2027
```

This makes the action clear without needing a dialog.

## 3. Do not switch years after copying

Currently, clicking copy changes the selected financial year after copying. That can feel like the app unexpectedly navigated away.

Change the behaviour so:

- the current FY data is copied to the target FY
- the user stays on the current FY
- a toast confirms the action

Example:

```text
Copied FY 2027 data to FY 2026
```

This is safer and easier to understand.

## 4. Optional future functionality for this tile

The `FY & Docs` tile could eventually include:

```text
FY selector
Upload docs
Document count
Copy to FY XXXX
Export FY summary
```

Recommended compact version for now:

```text
FY & Docs
FY 2027
Upload docs
Copy → FY 2026
```

Optional future enhancement:

```text
3 docs uploaded
```

This would make the upload function feel more useful, but only if uploaded documents are actually tracked/persisted.

## Implementation plan

### 1. Remove the normal `Saved` display

In `src/pages/CashflowTracker.tsx`:

- remove the always-visible autosave label from the `FY & Docs` tile
- keep autosave logic intact
- render only a small `Saving...` line when `autosaveStatus === "saving"`

Result:

```text
Saving...
```

appears only during active autosave, then disappears.

### 2. Replace `Copy FY` with a contextual target label

Add a helper that determines the target financial year:

```text
Current FY 2027 → target FY 2026
Current FY 2026 → target FY 2027
```

Then display:

```text
Copy → FY 2026
```

or:

```text
Copy → FY 2027
```

### 3. Update the copy behaviour

Modify the existing `saveAsNewPeriod` function so it:

- copies the current cashflow state to the target FY
- does not call `setFinancialYear(targetYear)`
- does not switch the active tile/dropdown to the target year
- shows a confirmation toast

Example toast:

```text
Copied FY 2027 to FY 2026
```

### 4. Preserve existing functionality

No changes to:

- financial year dropdown state
- upload accepted file types
- cashflow calculations
- Utilities & Charges
- property details
- localStorage-based save structure

## Expected result

The compact tile becomes cleaner:

```text
FY & Docs
FY 2027
Upload docs
Copy → FY 2026
```

During autosave only:

```text
Saving...
```

No permanent `Saved` label is shown.
