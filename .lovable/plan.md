
Remove the redundant **Manage** text from the Property details tile now that the entire tile is clickable.

## Change

- Update the property details summary tile in `src/pages/CashflowTracker.tsx`.
- Remove the small **Manage** label from the top-right of the tile.
- Keep the tile itself fully clickable with the existing `aria-label="Edit property details"` so the interaction remains accessible.
- Keep the hover/focus styling on the whole tile so users still understand it can be opened.

## Expected result

The Property details tile will look cleaner and less repetitive, while still opening the property details sheet when clicked.
