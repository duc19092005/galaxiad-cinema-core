# Design Plan — Cinema UI Redesign

## Brand
**Word**: DEPTH  
**Vibe**: A24-meets-premium-cinema — warm, editorial, tactile  
**Market**: Vietnam, urban 18-35  
**Competitor gap**: CGV/Galaxy feel generic → we feel like a film still

## Color Palette (6 named values)

```
accent     = #d97706 (amber-600 dark) / #b45309 (amber-700 light) — warm, not aggressive red
accent-soft= tinted variant for badges/tags
surface    = 3-layer hierarchy (base → card → elevated)
text       = primary / secondary / muted
border     = subtle dividers
gold       = rating stars
```

## Typography
- **Body**: Inter, 15px / 1.65 line-height
- **Display**: Inter, weight 400–500 (never >500)
- **Scale**: xs(11) sm(13) base(15) lg(18) xl(22) 2xl(28)

## Layout Signature
**"The amber glow"** — All interactive elements pulse with a warm amber ring on focus. Cards have 1px borders that shift color on hover. Page titles use a vertical amber bar + thin letter-spacing.

## Page Concepts

### HomePage (public)
```
┌─────────────────────────────────────────┐
│ NAV: 52px, bg-surface, amber accent dot│
├─────────────────────────────────────────┤
│ HERO: full-bleed image, centered CTA    │
│    "Cinematic Adventure"                │
├─────────────────────────────────────────┤
│ Now Showing: 5-col grid, poster cards   │
│ Coming Soon: same grid layout           │
└─────────────────────────────────────────┘
```

### AdminPage
```
┌──────────┬──────────────────────────────┐
│ SIDEBAR  │ MAIN CONTENT                 │
│ 272px    │ tabs: users / audit / jobs   │
│ bg-base  │ transfer                      │
│          │ Table: clean, sortable rows   │
└──────────┴──────────────────────────────┘
```

### MovieManagerPage
```
┌─────────────────────────────────────────┐
│ HEADER: title + add button              │
├─────────────────────────────────────────┤
│ TABLE: poster thumbnail, name, genres,  │
│ duration, status, actions               │
│ Inline edit modal on row click          │
└─────────────────────────────────────────┘
```

### BookingPage
```
┌─────────────────────────────────────────┐
│ Screen indicator (curved)               │
│ Seat grid: 3-section (left/right/top)   │
│ Legend: available / selected / taken    │
│ Bottom bar: selected count + price +    │
│   "Continue" button                     │
└─────────────────────────────────────────┘
```

## Signature Element
**"The amber accent line"** — Every section heading gets a thin vertical bar (`--accent` color, 3px wide, 24px tall) on its left. This tiny detail ties the entire UI together and is instantly recognizable.

## Dark/Light Logic
- Single `.dark` class on `<html>`, no "modern" mode needed visually
- Modern mode: keep as alias for `.dark` with indigo accent override via CSS var
- Persist to localStorage('theme'), read before first paint
- Every styled element: `transition: background-color 500ms, color 500ms, border-color 500ms`

## FE Shift Integration Checkpoints

### Checkpoint 2026-06-13 01
- Added `shiftAxios` with `/api/v1` base URL and shared interceptors.
- Added shift DTO/request types in `src/types/shift.types.ts`.
- Added `staffShiftApi` for Staff shift, clock-in/out, payroll, history, face registration, and SSE URL helpers.
- Added `theaterShiftApi` for templates, registrations, staff profiles, assignment, and payroll workflows.
- Extended auth typings and helpers to preserve JWT permission claims in `user_info`.
- Next: build Cashier POS page and route `/cashier`.

### Checkpoint 2026-06-13 02
- Added `src/features/cashier/CashierPage.tsx`.
- Replaced `/cashier` HomePage placeholder with the POS Shift Terminal route.
- Implemented clock-in with staff selector/manual Staff ID, 128-number face vector input, optional simulated time, and POS-token preservation.
- Implemented clock-out with staff JWT, POS-token restore, and persisted cashier session recovery.
- Added mobile collapse for the POS two-column layout.
- Next: build Theater Manager Employees workspace for staff profiles, registrations, assignment, and payroll.

### Checkpoint 2026-06-13 03
- Added `EmployeesShiftWorkspace` under Theater Manager.
- Replaced the Employees placeholder with real shift operations bound to `/api/v1/TheaterManager/Shifts`.
- Implemented staff profile list, face vector registration modal, active/inactive staff toggle, registration approval/rejection/cancellation, direct shift assignment, payroll calculation, and payroll payment.
- Added responsive collapse for employee summary and operation grids.
- Next: add staff self-service shift/payroll view and SSE notifications, then run build.

### Checkpoint 2026-06-13 04
- Added `ShiftNotificationListener` inside the app router.
- Connected SSE to `/api/v1/Staff/Shifts/notifications/sse` with credentials.
- Mapped shift approval, rejection, cancellation, assignment, and payroll events to existing toast styles.
- Next: add staff self-service shift/payroll view if build budget allows, then verify.

### Checkpoint 2026-06-13 05
- Added `StaffShiftSelfService` inside Account profile for Cashier and TheaterManager roles.
- Implemented staff-facing available shift lookup, shift registration by date range, my registrations, my work-log count, and my payroll summary.
- Bound the panel to `/api/v1/Staff/Shifts/available`, `/register`, `/my-registrations`, `/my-history`, and `/my-payroll`.
- Next: run TypeScript build, fix compile issues, and verify the UI locally.

### Checkpoint 2026-06-13 06
- Fixed FE compile issues after the shift integration.
- Cleaned scoped ESLint warnings/errors for the new shift API, cashier, theater employee, notification, staff self-service, and auth-helper files.
- Verified `npm run build` passes.
- Confirmed full-repo `npm run lint` still fails on pre-existing unrelated files; the newly added shift scope passes lint.
- Next: run the local Vite app and do a visual smoke check.

### Checkpoint 2026-06-13 07
- Added Admin role-permission management UI under the new `Permissions` sidebar tab.
- Connected `GET /api/v1/AdminManageUsers/permissions`, `GET /api/v1/AdminManageUsers/roles-permissions`, and `PUT /api/v1/AdminManageUsers/roles/{roleId}/permissions`.
- Added searchable permission matrix with select visible, clear visible, reset, unsaved-change guard, and save confirmation.
- Cleaned Admin permission-related scoped lint, including typed admin API response normalization.
- Verified `npm run build` passes after the permission UI work.

### Checkpoint 2026-06-13 08
- Added cashier shift reminder panel on `/cashier`.
- Loaded approved personal shift registrations from `/api/v1/Staff/Shifts/my-registrations`.
- Calculated the nearest upcoming approved shift and showed the start time, end time, date, and urgency state.
- Added pre-shift preparation notes for uniform, name badge, POS/printer checks, cash drawer readiness, and account safety.
- Verified `npm run build` and scoped ESLint for `CashierPage.tsx` pass.

### Checkpoint 2026-06-13 09
- Added employee portrait upload to the Admin Create New Account modal.
- Added required identity code, phone number, and date of birth fields so Admin account creation matches backend validation.
- Connected `PUT /api/v1/AdminManageUsers/{userId}/portrait` with multipart upload after account creation.
- Rendered uploaded portraits in Admin user list, Theater Manager staff profiles, and Cashier selected staff card.
- Verified FE build and scoped ESLint pass for portrait-related files.
