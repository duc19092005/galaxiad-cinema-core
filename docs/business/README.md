# Galaxiad Cinema Core - Business Logic & Rules Directory

This document details all the core business logic, validation rules, operational constraints, and workflow state machines implemented across the Galaxiad Cinema backend and frontend systems.

---

## 1. User Identity & Access Management (IAM)

### Role Categories
Users in the system are classified into four main hierarchy categories:
- **Customer**: Standard end-users who browse movies, book tickets, earn points, and redeem vouchers.
- **Staff**: Cinema operational employees (e.g., Cashiers) who register for shifts and perform check-ins.
- **Manager**: Intermediate admin roles (e.g., Movie Manager, Theater Manager, Facilities Manager) responsible for operational setup.
- **Admin**: System administrators with full read/write privileges across all schemas.

### Staff Classification
Employees are classified into two scheduling work types:
- **Full-Time**: Expected to work standard full shifts.
- **Part-Time**: Expected to work short or flexible shifts.

### Sensitive Data Encryption
- Customers' government identity cards (`IdentityCode`) must be encrypted using AES-256 with strong keys (`AES_256:Key` and `AES_256:IV`) before persisting to the database. They are decrypted only on authorized profile read requests.

### Password Security
- Passwords must be hashed using the BCrypt algorithm with a random salt to protect against rainbow table attacks. Plain text password comparison is forbidden.

---

## 2. Theater Operations & Shift Scheduling

### Operating Hours Constraint
- The theater's operational window is strictly defined from **06:00 AM to 02:00 AM the next day** (Vietnam local timezone, UTC+7). No shifts or movie showtimes may be scheduled outside this range.

### Timezone Normalization
- All scheduling timestamps are received from the frontend as local Vietnam times (UTC+7).
- The backend combines the local dates and times, normalizes them to UTC, and stores them in the database.
- Responses from the backend convert the UTC dates/times back to local Vietnam times (UTC+7) before sending them to the client.

### Shift Duration Rules
Shift templates and schedules are validated based on their classified `ShiftType`:
- **Full-Time Shifts**: Must span exactly **8.0 hours** in duration.
- **Part-Time Shifts**: Must span exactly **4.0 hours** in duration.
- **Rotating (Ca xoay) Shifts**: Custom duration shifts.

### Shift Registration Rules
Staff registrations must satisfy the following constraints based on their employment type:
- **Part-Time Staff**:
  - Can only register for `Part-Time` shifts or `Rotating` shifts with a duration $\le$ 4 hours.
  - Are forbidden from registering for `Full-Time` shifts.
- **Full-Time Staff**:
  - Can register for `Full-Time` shifts.
  - Can register for `Part-Time` or short `Rotating` shifts ($<$ 8 hours) only if they provide a valid reason in the `Notes` field.

---

## 3. Movie Catalog & Showtimes Management

### Catalog Visibility
- Movies are managed via `Active` / `Inactive` states.
- Inactive movies are filtered out from all public listings (Now Showing, Coming Soon).

### Showtime Placement Constraints
- Showtimes must be scheduled inside the theater's operating window (06:00 AM to 02:00 AM).
- Two movie showtimes cannot overlap in the same auditorium. Cleaning and maintenance buffers are enforced between sessions.

---

## 4. Ticket Booking & Payment Lifecycle

### Reservation & Seat Locking
- When a customer starts a ticket purchase, the selected seats are locked immediately to prevent double-booking.
- **Seat Reservation Timeout**: Locked seats are held for a specific timeframe (e.g., 10-15 minutes). If payment is not finalized within this period, the lock expires, and the seats are released back to the general pool.

### Payment Processing & Callbacks
- Payments are processed through the external VNPay service.
- **Success Callback**: Updates the order status to `Booked`, confirms the seats permanently, awards loyalty points, and clears the user's profile and booking history cache.
- **Failure Callback**: Cancels the order, removes the locks from the seats, and updates the status to `Failed`.

### Ticket Access Rules
- Accessing JSON ticket data or downloading PDF/text tickets is restricted to orders with a status of `Booked`. Unpaid or failed orders return a `NotFoundException`.

---

## 5. Pricing Promotions & Surcharges

### Base Ticket Price
- Set initially by the movie format (e.g., 2D, 3D, IMAX).

### Surcharges
Ticket prices are dynamically calculated by applying surcharges:
- **Seat Surcharges**: VIP seats add an extra fee compared to Standard seats.
- **Showtime Slot Surcharges**: Special time windows (e.g. late night, weekends) trigger surcharges.
- **Holiday Surcharges**: Applies extra fees on recognized calendar holidays.

### Calculation Priority Rules
1. **Fixed Ticket Price overrides**: If a matching rule dictates a fixed price (e.g., "Student Ticket 50,000 VND"), it replaces the base price. Only the highest priority fixed rule is applied.
2. **Adjustments**: Other active rules are applied sequentially in descending order of priority:
   - **Percent Discounts** (e.g., -10% for members).
   - **Fixed Discounts** (e.g., -15,000 VND).
   - **Surcharges** (e.g., +20% for IMAX formats).

---

## 6. Voucher and Loyalty Points System

### Earning Points
- Customers earn a percentage of their total paid booking value as reward points upon successful VNPay transaction completion.

### Voucher Redemption
- Customers can redeem vouchers in exchange for accumulated loyalty points.
- **Eligibility Checking**: Vouchers can be restricted to specific user segments or roles (e.g. VIP-only vouchers).
- **Validity Checks**: Only active vouchers within their `ValidFrom` and `ValidTo` dates can be redeemed.

---

## 7. Reviews and Comments Moderation

### Moderation Workflow
- User comments/reviews are submitted as `Pending` by default.
- They must be reviewed and approved by a Manager or Admin before becoming visible on public movie detail pages.

### Comment Deletion & IDOR Protection
- A customer is allowed to delete only their own comments.
- Ownership checks (`comment.UserId == currentUserId`) are strictly enforced. Administrators bypass this rule to moderate comments.

---

## 8. Caching Strategy (Redis)

### Read-Through Caching (Cache-Aside)
Frequently queried public data is cached in Redis to decrease database load:
- **Movies lists**: Now Showing and Coming Soon listings.
- **Movie details**: Movie info page contents, formats, and approved reviews.
- **User profile and history**: Personal account data and booking logs.

### Active Invalidation (Cache Eviction)
To maintain data consistency, caches are explicitly cleared upon any state mutations:
- Adding/updating/deleting movies, showtimes, or formats evicts the Now Showing and Coming Soon cache.
- Approving or deleting comments, or updating movie details evicts the target movie details cache (`movie:detail:{movieId}`).
- Creating a booking or successful payment callback clears the user's profile and booking history cache (`user:profile:{userId}` / `user:bookings:{userId}`).
