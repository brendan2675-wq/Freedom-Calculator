

## Replace "Sign In" buttons across the app

Since `/login` is now the entry point and users are always authenticated by the time they reach Home / PPOR / Portfolio, the per-page "Sign In" button in the header is redundant.

### Current state

The `Header` component (used on Home, PPOR, Portfolio, Adviser, Agent pages) shows a **"Sign In"** button that opens the legacy `AuthFlow` dialog. That dialog is now dead weight — the real login lives at `/login`.

### Proposed change

Replace the "Sign In" button with a **user menu** showing who's signed in and what role, with a **Sign Out** action. This matches the pattern of every real SaaS app and gives the user something useful in that slot.

**New header control (right side):**

```text
┌─────────────────────────────┐
│  👤 Sam Client    ▼         │   ← click to open menu
└─────────────────────────────┘
            │
            ▼
┌─────────────────────────────┐
│  Sam Client                 │
│  sam@atelierwealth.com      │
│  Role: Client               │
│  ─────────────────────────  │
│  ⎋  Sign out                │   ← clears session, returns to /login
└─────────────────────────────┘
```

### What changes

1. **`src/components/Header.tsx`**
   - Remove the "Sign In" button and the `AuthFlow` dialog import/state
   - Add a dropdown trigger showing the signed-in user's name + a small role badge (Client / Adviser / Agent)
   - Dropdown contents: name, email, role, divider, **Sign out** action
   - Sign out clears the session via `clearSession()` from `lib/auth.ts` and navigates to `/login`

2. **`src/components/AuthFlow.tsx`** — delete (no longer used anywhere)

3. **Remove `clientName` / `setClientName` plumbing** that only existed to feed the old AuthFlow dialog. The display name now comes from `getSession()` in `lib/auth.ts`, which is already the source of truth set at `/login`.

### Why a user menu (not just a Sign Out button)

- Confirms to the user *which account / role* they're in — important because Adviser vs Client vs Agent show different data
- Standard pattern, zero learning curve
- Leaves room to later add "Switch role" or "Account settings" without redesigning the header

### Out of scope

- No change to `/login` itself
- No change to routing or `RoleGuard`
- localStorage `clientName` key cleanup is not needed — once `AuthFlow` is gone nothing writes to it

