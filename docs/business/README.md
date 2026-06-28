# Galaxiad Cinema Core - Business Logic Reference Directory

This document details all core business rules, validation constraints, and operational logic implemented across the Galaxiad Cinema backend and frontend systems.

---

## Core Business Logic & Rules (STT)

| STT | Component / Area | Rule Title | Business Logic & Verification Constraint |
| :---: | :--- | :--- | :--- |
| **1** | **Identity & Access** | IAM Roles | Users are categorized into standard hierarchy levels: `Customer`, `Staff`, `Manager`, and `Admin`. |
| **2** | **Identity & Access** | Staff Classification | Staff profiles are classified into `FullTime` and `PartTime` employment categories. |
| **3** | **Identity & Access** | Data Encryption | Customer `IdentityCode` values are encrypted using AES-256 with strong key/IV variables before DB storage. |
| **4** | **Shift Operations** | Operating Hours | The cinema operational window is strictly capped between **06:00 AM and 02:00 AM the next day** (Vietnam local timezone, UTC+7). |
| **5** | **Shift Operations** | Timezone Normalization | Inputs (UTC+7) are combined with dates and converted to UTC on write, then converted back to UTC+7 when returning API responses. |
| **6** | **Shift Operations** | Shift Durations | Shift templates are validated strictly: `FullTime` = exactly 8.0 hours; `PartTime` = exactly 4.0 hours. |
| **7** | **Shift Registration** | Staff Registration Rules | `PartTime` staff register for $\le 4$h shifts. `FullTime` staff registering for short shifts ($< 8$h) must supply validation notes. |
| **8** | **Seat Reservation** | Live Seat Locking | Seat selection locks seats dynamically. Unpaid reservations expire after a timeout (10-15 mins) and seats are freed. |
| **9** | **Seat Booking** | Payment Callback | VNPay payment callbacks set status to `Booked`. Unpaid/failed bookings release seat locks. Ticket downloads require `Booked` status. |
| **10** | **Pricing Promotions** | Pricing Overrides | `FixedTicketPrice` rules override base ticket prices (e.g. Student tickets), with the highest priority rule taking precedence. |
| **11** | **Pricing Promotions** | Pricing Adjustments | Other active pricing rules (Percent/Fixed discounts and surcharges) are applied sequentially in descending order of priority. |
| **12** | **Pricing Promotions** | Surcharges | Ticket prices calculate surcharges based on VIP seat segments, holidays/weekends, and movie formats (3D/IMAX). |
| **13** | **Vouchers & Loyalty** | Voucher Redemption | Vouchers are redeemed using accumulated loyalty points. Vouchers can restrict eligibility by user role/segment. |
| **14** | **Comments & Security** | Owner Authorization (IDOR) | Users can only modify or delete comments they own (`comment.UserId == currentUserId`), enforced via JWT claim context. |
| **15** | **Caching & Eviction** | Active Eviction | Lists, movie details, and user profiles are cached (Cache-Aside). Caches are evicted on movie, schedule, review, or booking mutations. |
