# Galaxiad Cinema Core - Business Logic Matrix

This document maps all core business rules and logic in a 2D matrix structure using coordinates `(Y, X)`, where `Y` represents the operational category (rows) and `X` represents the specific logic constraints (columns).

---

## Business Rules Matrix (Y, X)

| Row (Y) | Column (X) | Component / Area | Rule Title | Business Logic & Verification Constraint |
| :---: | :---: | :--- | :--- | :--- |
| **0** | **0** | **Identity & Access** | IAM Roles | Users are categorized into standard hierarchy levels: `Customer`, `Staff`, `Manager`, and `Admin`. |
| **0** | **1** | **Identity & Access** | Staff Classification | Staff profiles are classified into `FullTime` and `PartTime` employment categories. |
| **0** | **2** | **Identity & Access** | Data Encryption | Customer `IdentityCode` values are encrypted using AES-256 with strong key/IV variables before DB storage. |
| **1** | **0** | **Shift Operations** | Operating Hours | The cinema operational window is strictly capped between **06:00 AM and 02:00 AM the next day** (Vietnam local timezone, UTC+7). |
| **1** | **1** | **Shift Operations** | Timezone Normalization | Inputs (UTC+7) are combined with dates and converted to UTC on write, then converted back to UTC+7 when returning API responses. |
| **1** | **2** | **Shift Operations** | Shift Durations | Shift templates are validated strictly: `FullTime` = exactly 8.0 hours; `PartTime` = exactly 4.0 hours. |
| **2** | **0** | **Shift Registration** | Staff Registration Rules | `PartTime` staff register for $\le 4$h shifts. `FullTime` staff registering for short shifts ($< 8$h) must supply validation notes. |
| **2** | **1** | **Seat Reservation** | Live Seat Locking | Seat selection locks seats dynamically. Unpaid reservations expire after a timeout (10-15 mins) and seats are freed. |
| **2** | **2** | **Seat Booking** | Payment Callback | VNPay payment callbacks set status to `Booked`. Unpaid/failed bookings release seat locks. Ticket downloads require `Booked` status. |
| **3** | **0** | **Pricing Promotions** | Pricing Overrides | `FixedTicketPrice` rules override base ticket prices (e.g. Student tickets), with the highest priority rule taking precedence. |
| **3** | **1** | **Pricing Promotions** | Pricing Adjustments | Other active pricing rules (Percent/Fixed discounts and surcharges) are applied sequentially in descending order of priority. |
| **3** | **2** | **Pricing Promotions** | Surcharges | Ticket prices calculate surcharges based on VIP seat segments, holidays/weekends, and movie formats (3D/IMAX). |
| **4** | **0** | **Vouchers & Loyalty** | Voucher Redemption | Vouchers are redeemed using accumulated loyalty points. Vouchers can restrict eligibility by user role/segment. |
| **4** | **1** | **Comments & Security** | Owner Authorization (IDOR) | Users can only modify or delete comments they own (`comment.UserId == currentUserId`), enforced via JWT claim context. |
| **4** | **2** | **Caching & Eviction** | Active Eviction | Lists, movie details, and user profiles are cached (Cache-Aside). Caches are evicted on movie, schedule, review, or booking mutations. |
