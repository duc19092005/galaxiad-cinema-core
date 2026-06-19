# Controller Organization

Controllers are grouped first by audience/role boundary, then by feature area.
Routes are intentionally preserved for frontend compatibility.

## Folders

- `Identity/`: authentication and current-user profile endpoints.
- `Customer/`: public/customer-facing flows.
  - `Booking/`: public movie booking catalog and order/payment endpoints.
  - `Catalog/`: public browsing endpoints outside the booking module.
  - `Engagement/`: comments, notifications, recommendations.
  - `Vouchers/`: customer voucher store and wallet.
- `Admin/`: admin-only platform management endpoints.
- `Management/`: back-office manager role endpoints.
  - `Facilities/`: cinema, auditorium, department, movie format management.
  - `Movies/`: movie manager catalog maintenance.
  - `Theaters/`: theater manager schedule, shift, selection data.
- `Staff/`: staff/cashier self-service endpoints.

## Rule Of Thumb

If an endpoint is used by customers, put it under `Customer`.
If it is used by a named back-office role, put it under `Management/<role-domain>`.
If it requires full admin ownership, put it under `Admin`.
Do not move routes just to match folders; update frontend callers only when a route intentionally changes.
