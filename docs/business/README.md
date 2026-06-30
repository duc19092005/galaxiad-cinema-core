# Galaxiad Cinema — Business Rules Reference

> **Document Versions:**
> - [English (this file)](README.md)
> - [Tiếng Việt](vi/README.md)
> - [Русский](ru/README.md)

---

## 1. Accounts & Access Control

| Code | Rule Name | Content |
|:----:|:----------|:--------|
| **BS01** | Admin-only configuration | Facility categories, department lists, and system configuration can only be managed by accounts with **Admin** role. |
| **BS02** | Customer registration age | A person must be at least **16 years old** to register as a Customer. |
| **BS03** | Staff registration age | A person must be at least **18 years old** to register as Staff. |
| **BS04** | Registration methods | Registration can be done via **email/password** or by **Google account**. |
| **BS05** | Role-based access | Each user has a role. Users can only see and perform actions that match their role's permissions. |
| **BS06** | Account locking | An **Admin** can lock a user account. The lock reason must be recorded. |
| **BS07** | Session security | Login sessions use secure tokens (JWT). Sessions expire automatically. |
| **BS08** | Permission change security | If a user's permissions change during an active session, the system logs them out for security. |

### User Roles

| Role | Business Description |
|:----:|:--------------------|
| **Customer** | Browses movies, books tickets, writes reviews, manages own bookings |
| **Cashier** | Sells tickets at the cinema counter, processes payments for walk-in customers |
| **Movie Manager** | Adds, edits, and removes movies in the system |
| **Theater Manager** | Manages cinemas, auditoriums, staff shifts, and movie schedules |
| **Facilities Manager** | Manages cinema facilities, auditorium layouts, and equipment |
| **Admin** | Full access: manages users, roles, rights transfers, vouchers, promotion rules, and views audit logs |

---

## 2. Cinemas & Facilities

| Code | Rule Name | Content |
|:----:|:----------|:--------|
| **BS09** | Cinema manager assignments | Each cinema can have a **Theater Manager** and a **Facilities Manager** assigned. |
| **BS10** | Auditorium format support | An auditorium can support one or more movie formats (2D, 3D, IMAX, 4DX, etc.). |
| **BS11** | Complete seat layout | An auditorium's seat map must be complete. Rows and columns must be continuous with no unexpected gaps. |
| **BS12** | Unique seat position | Every seat in an auditorium must have a unique grid position. |
| **BS13** | Unique seat label | Every seat must have a unique label. Two seats cannot both be named "A1". |
| **BS14** | Department types | A cinema can have departments such as **Ticket Counter** and **Food Counter**. |
| **BS15** | Department shared accounts | Each department has a shared login account for cashiers. |

---

## 3. Movie Management

| Code | Rule Name | Content |
|:----:|:----------|:--------|
| **BS16** | Movie age ratings | Every movie must have an age rating classification. |
| **BS17** | Movie formats | A movie can be available in multiple formats (2D, 3D, IMAX, 4DX, etc.). |
| **BS18** | Now showing vs Coming soon | A movie is flagged as either **Now Showing** or **Coming Soon**. |

### Age Rating Classifications

| Label | Meaning |
|:----:|:--------|
| **P** | Suitable for all ages |
| **K** | Under 13 requires parental or guardian accompaniment |
| **T13** | For audiences ages 13 and above |
| **T16** | For audiences ages 16 and above |
| **T18** | For audiences ages 18 and above |
| **C** | Not permitted for distribution |

---

## 4. Showtime Scheduling

| Code | Rule Name | Content |
|:----:|:----------|:--------|
| **BS19** | Schedule assignment | Each showtime belongs to one movie, one auditorium, and one movie format. |
| **BS20** | Format compatibility | The showtime's movie format must be supported by the selected auditorium. |
| **BS21** | Cleaning gap | There must be at least **15 minutes** between the end of one showtime and the start of the next in the same room. |
| **BS22** | No past showtimes | A showtime cannot be scheduled in the past. |
| **BS23** | No overlapping showtimes | Showtimes in the same auditorium cannot overlap with each other. |
| **BS24** | Operating hours | All showtimes must fall within the cinema's operating hours: **6:00 AM to 2:00 AM** the next day (Vietnam local time). |
| **BS25** | Vietnam timezone | All scheduling times follow Vietnam local time (UTC+7). The backend stores times in UTC and converts for display. |

---

## 5. Ticket Booking

| Code | Rule Name | Content |
|:----:|:----------|:--------|
| **BS26** | Minimum seats | A customer must select at least **1 seat** to make a booking. |
| **BS27** | Maximum seats | A customer cannot select more than **10 seats** in a single order. |
| **BS28** | No duplicate seats | The same seat cannot be selected twice in the same order. |
| **BS29** | Unavailable seats | Seats that are already paid for or temporarily held by another customer cannot be selected. |
| **BS30** | Isolated seat avoidance | Customers must not select seats in a way that leaves only **one single empty seat** between occupied seats in a row. |
| **BS31** | Temporary seat holding (SSE) | When a customer selects seats and starts checkout, those seats are held temporarily via SSE + HTTP POST lock. If payment is not completed in **10 minutes**, the seats become available again. |
| **BS32** | Auto-cancel pending orders | Orders that remain **Pending** (unpaid) for more than **10 minutes** are automatically cancelled by a Hangfire recurring job running every 5 minutes. Seats are released upon cancellation. |
| **BS33** | Release seats on disconnect | If a client's SSE connection drops (closing browser, timeout), all seats locked by that client are automatically released. |
| **BS34** | Payment method | Online payments are processed through **VNPay**. Counter sales can be processed in cash by a Cashier. |
| **BS35** | Server-side pricing | The final ticket price is always calculated on the backend. The system does not trust the price sent from the browser. |
| **BS36** | Pricing snapshot | Applied prices and promotions are saved as a snapshot on the order for historical reference. |
| **BS37** | Booking confirmation | A booking is only valid after successful payment. The customer receives a booking code and can download a PDF ticket. |
| **BS38** | Booking modification | Customers can modify or cancel a booking up to **2 hours before the showtime**. Cancellation fees may apply. |
| **BS39** | Refund timeline | Refunds are processed to the original payment method within **5–7 business days**. |

### Order Statuses

| Status | Business Meaning |
|:------:|:----------------|
| **Pending** | Seats are selected but payment has not been completed yet |
| **Booked** | Payment successful, ticket is valid and confirmed |
| **Canceled** | Order was canceled by the customer or due to payment timeout |
| **Refunded** | Payment was refunded (e.g., technical issue or cinema cancellation) |
| **Completed** | Customer has attended the screening and the ticket has been scanned |

---

## 6. Pricing & Promotions

| Code | Rule Name | Content |
|:----:|:----------|:--------|
| **BS40** | Base price | Every movie format has a base ticket price. This is the starting point for all pricing calculations. |
| **BS41** | Format discount | A cinema can set a discount percentage for specific movie formats. |
| **BS42** | Format surcharge | A cinema can set a surcharge percentage for specific formats and customer segments. |
| **BS43** | Promotion types | Promotions can be: **Fixed Ticket Price**, **Percent Discount**, **Fixed Discount**, or **Surcharge**. |
| **BS44** | Promotion scope | A promotion rule can be scoped by format, cinema, auditorium, customer segment, date range, time range, and days of week. |
| **BS45** | Promotion priority | When multiple promotions conflict, the one with the **highest priority** wins. |
| **BS46** | Fixed price resolution | If multiple fixed-price rules match, only the one with the highest priority is used. If priority ties, the lowest price wins. |
| **BS47** | Day-of-week promotion | Promotions can be configured to apply on specific days using a **7-bit bitmask** (bit 0 = Sunday, bit 1 = Monday, etc.). |
| **BS48** | Holiday calendar exclusion | A promotion campaign can be configured to **not apply on public holidays** via a holiday calendar entity. |
| **BS49** | Price floor | The final ticket price cannot go below zero. |
| **BS50** | Public offers | Active promotions are shown publicly on the Offers page and are **applied automatically** during booking. No coupon code needed. |

### Special Customer Pricing

| Code | Rule Name | Content |
|:----:|:----------|:--------|
| **BS51** | Student pricing | Students may receive a fixed special ticket price when eligible. |
| **BS52** | Senior discount | Senior citizens receive at least **20% discount** on ticket prices. |
| **BS53** | Disabled discount | Severely disabled persons receive at least **50% discount**. |
| **BS54** | Special assistance | Specially severely disabled persons receive **free tickets**. |

> Special pricing applies for direct purchases at the counter with valid identification.

---

## 7. Vouchers & Loyalty Points

| Code | Rule Name | Content |
|:----:|:----------|:--------|
| **BS55** | Voucher creation | An Admin can create vouchers with a name, description, discount amount/percent, points cost, quantity, and validity dates. |
| **BS56** | Voucher stock | Each voucher has a total quantity and a remaining quantity in stock. |
| **BS57** | Voucher redemption | A customer can redeem a voucher using their loyalty reward points. |
| **BS58** | Voucher out of stock | A voucher cannot be redeemed if its remaining quantity is zero. |
| **BS59** | Voucher expiration | A voucher cannot be redeemed outside its valid date range. |
| **BS60** | Insufficient points | A customer cannot redeem a voucher if they do not have enough reward points. |
| **BS61** | Points deduction | Reward points are deducted immediately when a voucher is redeemed. |

---

## 8. Staff & Shift Management

| Code | Rule Name | Content |
|:----:|:----------|:--------|
| **BS62** | Staff types | Staff members are classified as **Full-Time** or **Part-Time**. |
| **BS63** | Full-time shift duration | Full-time shifts must last exactly **8 hours**. |
| **BS64** | Part-time shift duration | Part-time shifts must last exactly **4 hours**. |
| **BS65** | Operating hours window | Shifts can only be assigned between **06:00 and 02:00 (next day)** (UTC+7). |
| **BS66** | Part-time shift eligibility | Part-time staff can only register for part-time shifts (4h) or rotating shifts no longer than 4 hours. |
| **BS67** | Full-time short shift reason | Full-time staff who register for a shift shorter than 8 hours must provide a written reason. |
| **BS68** | Cinema assignment | Staff can only register for shifts at the cinema they are assigned to. |
| **BS69** | Shift within operating hours | All shifts must be within the cinema's operating hours (6:00 AM to 2:00 AM). |
| **BS70** | No duplicate registration | A staff member cannot register for the same shift twice. |
| **BS71** | Shift approval | Shift registrations start as **Pending** and require manager or Admin approval. |
| **BS72** | Clock-in required | Staff must clock in at the start of their shift. Clock-in is allowed only within the shift's time window. |
| **BS73** | Clock-out required | Staff must clock out at the end of their shift. Clock-out time must be after clock-in time. |
| **BS74** | Face recognition check-in | Staff can register their face (128-float vector encrypted in DB) for browser-based facial recognition clock-in/out. |
| **BS75** | Payroll calculation | Pay is calculated based on logged working hours and the staff member's hourly rate. |
| **BS76** | Payroll payment | Managers can calculate and pay payroll. Payroll can only be paid once. |

---

## 9. Customer Comments & Reviews

| Code | Rule Name | Content |
|:----:|:----------|:--------|
| **BS77** | Comment moderation | Customer comments and reviews go through a **moderation** process before being published. |
| **BS78** | Comment ownership | A customer can only **edit** or **delete** their own comments. |
| **BS79** | Reply ownership | A customer can only **edit** or **delete** their own replies to comments. |
| **BS80** | Comment eligibility | Only customers who have watched a movie (paid ticket, showtime ended) can post comments and ratings on that movie. One review per movie per customer. |

---

## 10. Chatbot (Virtual Assistant)

| Code | Rule Name | Content |
|:----:|:----------|:--------|
| **BS81** | Chatbot topics | The chatbot can handle: movie lists, showtimes, bookings, cinema statistics, audit logs, and general FAQ. |
| **BS82** | Role-based chatbot access | Guest users can only browse movies. Customers can book tickets. Managers can view schedules. Admin can manage everything. The chatbot declines unauthorized requests. |
| **BS83** | 3-layer protection | The chatbot has 3 safety layers: (1) **Linguistic guard** — filters inappropriate language, (2) **Intent classification** — routes to correct tool, (3) **Tool registry** — each tool checks role permissions before executing. |
| **BS84** | Chatbot escalation | If the chatbot cannot understand the question, it directs the user to contact customer support. |
| **BS85** | Chatbot cannot create schedules | The LLM never directly creates showtime schedules. Managers must preview AI recommendations before applying. |

---

## 11. Admin Operations

| Code | Rule Name | Content |
|:----:|:----------|:--------|
| **BS86** | User management | Admin can view, add, block, or activate user accounts. |
| **BS87** | Role assignment | Admin can assign or remove roles for any user (7 available roles). |
| **BS88** | Rights transfer | Admin can transfer management rights from one person to another (e.g., transfer Theater Manager from staff A to staff B). |
| **BS89** | Background job monitoring | Admin can view and monitor background job execution and status (Hangfire dashboard). |
| **BS90** | Audit trail | All important actions are logged. Admin can view and search the audit log. |
| **BS91** | Shift deletion approval | When a manager deletes a shift that has staff registrations, an approval request is sent to Admin. |

---

## 12. System Operations

| Code | Rule Name | Content |
|:----:|:----------|:--------|
| **BS92** | Vietnam timezone | All times displayed to staff and customers use **Vietnam local time (UTC+7)**. Backend stores UTC, frontend auto-converts. |
| **BS93** | Three-language support | The system supports **English** (default), **Vietnamese** (UTF-8 with diacritics), and **Russian** (Cyrillic alphabet). |
| **BS94** | Data protection | Sensitive customer identity information must be protected before storage. |
| **BS95** | User data rights | Users have the right to access, edit, and request deletion of their personal data. |
| **BS96** | Cache freshness | Customer-facing data (movies, showtimes, etc.) must stay up to date after important business changes. Background services sync status every 10 minutes. |

---

## 13. Legal & Compliance

| Code | Rule Name | Content |
|:----:|:----------|:--------|
| **BS97** | Vietnamese film priority | Vietnamese film screenings are prioritized from **18:00 to 22:00**. |
| **BS98** | Under-13 screening hours | Screenings for customers under 13 must end **before 22:00**. |
| **BS99** | Under-16 screening hours | Screenings for customers under 16 must end **before 23:00**. |
| **BS100** | No recording | Customers must not illegally record movies in the theater. |
| **BS101** | No disruptive behavior | Customers must not cause disturbances or obstruct other customers. |
| **BS102** | No smoking | Tobacco and e-cigarettes are not permitted in the theater. |
| **BS103** | No weapons | Weapons, flammable materials, and toxic substances are prohibited. |
| **BS104** | No pets | Pets are not allowed in the cinema (except service animals). |
| **BS105** | No outside food | Outside food and drinks are not permitted without authorization. |
| **BS106** | Privacy commitment | Customer personal data is not sold or transferred to third parties without consent. |
| **BS107** | Cookie usage | The website uses cookies to improve user experience. Customers can manage cookie settings in their browser. |

---

## 14. Seat Layout Rules

| Code | Rule Name | Content |
|:----:|:----------|:--------|
| **BS108** | Auditorium must have seats | An auditorium must contain at least one seat. |
| **BS109** | Continuous rows | Seat rows must be filled continuously. A row cannot skip from position 1 to position 3 while position 2 is missing. |
| **BS110** | Continuous columns | Seat columns must be filled continuously without gaps in the middle. |
| **BS111** | No overlapping positions | Two seats cannot share the same grid position. |
| **BS112** | No duplicate labels | Two seats cannot have the same seat label in the same auditorium. |

---

## 15. Cashier Operations

| Code | Rule Name | Content |
|:----:|:----------|:--------|
| **BS113** | Counter sales | A Cashier can sell tickets at the cinema counter by selecting movie, showtime, and seats on behalf of the customer. |
| **BS114** | Customer lookup | A Cashier can look up a customer by email for counter sales. |
| **BS115** | Department POS access | Cashiers log in using the department's shared account to access the POS system. |

---

## 16. Background Jobs & Automation

| Code | Rule Name | Content |
|:----:|:----------|:--------|
| **BS116** | Auto-cancel pending orders | A Hangfire recurring job runs every 5 minutes to auto-cancel orders that are still **Pending** after 10 minutes, releasing locked seats. |
| **BS117** | Auto-sync movie/schedule status | A background service runs every 10 minutes to update movie active status and schedule states (e.g., mark showtimes as "completed" after end time). |
| **BS118** | Movie view buffer sync | Customer movie view events are buffered and synced in batches to reduce database writes. |
| **BS119** | AI embedding sync on startup | When the AI service starts, it syncs movie data to generate and store vector embeddings in Qdrant for semantic search. |

---

## 17. Showtime AI Recommendations

| Code | Rule Name | Content |
|:----:|:----------|:--------|
| **BS120** | AI only recommends, never creates | The AI generates recommendations but does not directly create showtimes. Managers must preview and apply. |
| **BS121** | Preview before apply | Managers must preview recommendations before applying them to schedules. |
| **BS122** | Apply re-validation | Apply always revalidates: movie authorization, format support, active date range, past time check, room conflicts, and cleaning gap (15 min). |
| **BS123** | Action audit | All actions (applied, dismissed, failed validation, viewed) are stored for audit purposes. |
