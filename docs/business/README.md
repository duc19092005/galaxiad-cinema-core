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
| **Admin** | Full access: manages users, roles, rights transfers, vouchers, and views audit logs |

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
| **BS31** | Temporary seat holding | When a customer selects seats and starts checkout, those seats are held temporarily. If payment is not completed in time, the seats become available again. |
| **BS32** | Payment method | Online payments are processed through **VNPay**. Counter sales can be processed in cash by a Cashier. |
| **BS33** | Server-side pricing | The final ticket price is always calculated on the backend. The system does not trust the price sent from the browser. |
| **BS34** | Pricing snapshot | Applied prices and promotions are saved as a snapshot on the order for historical reference. |
| **BS35** | Booking confirmation | A booking is only valid after successful payment. The customer receives a booking code and can download a PDF ticket. |
| **BS36** | Booking modification | Customers can modify or cancel a booking up to **2 hours before the showtime**. Cancellation fees may apply. |
| **BS37** | Refund timeline | Refunds are processed to the original payment method within **5–7 business days**. |

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
| **BS38** | Base price | Every movie format has a base ticket price. This is the starting point for all pricing calculations. |
| **BS39** | Format discount | A cinema can set a discount percentage for specific movie formats. |
| **BS40** | Format surcharge | A cinema can set a surcharge percentage for specific formats and customer segments. |
| **BS41** | Promotion types | Promotions can be: **Fixed Ticket Price**, **Percent Discount**, **Fixed Discount**, or **Surcharge**. |
| **BS42** | Promotion scope | A promotion rule can be scoped by format, cinema, auditorium, customer segment, date range, time range, and days of week. |
| **BS43** | Promotion priority | When multiple promotions conflict, the one with the **highest priority** wins. |
| **BS44** | Fixed price resolution | If multiple fixed-price rules match, only the one with the highest priority is used. If priority ties, the lowest price wins. |
| **BS45** | Holiday exclusion | A promotion campaign can be configured to **not apply on public holidays**. |
| **BS46** | Price floor | The final ticket price cannot go below zero. |
| **BS47** | Public offers | Active promotions are shown publicly on the Offers page and are **applied automatically** during booking. No coupon code needed. |

### Special Customer Pricing

| Code | Rule Name | Content |
|:----:|:----------|:--------|
| **BS48** | Student pricing | Students may receive a fixed special ticket price when eligible. |
| **BS49** | Senior discount | Senior citizens receive at least **20% discount** on ticket prices. |
| **BS50** | Disabled discount | Severely disabled persons receive at least **50% discount**. |
| **BS51** | Special assistance | Specially severely disabled persons receive **free tickets**. |

> Special pricing applies for direct purchases at the counter with valid identification.

---

## 7. Vouchers & Loyalty Points

| Code | Rule Name | Content |
|:----:|:----------|:--------|
| **BS52** | Voucher creation | An Admin can create vouchers with a name, description, discount amount/percent, points cost, quantity, and validity dates. |
| **BS53** | Voucher stock | Each voucher has a total quantity and a remaining quantity in stock. |
| **BS54** | Voucher redemption | A customer can redeem a voucher using their loyalty reward points. |
| **BS55** | Voucher out of stock | A voucher cannot be redeemed if its remaining quantity is zero. |
| **BS56** | Voucher expiration | A voucher cannot be redeemed outside its valid date range. |
| **BS57** | Insufficient points | A customer cannot redeem a voucher if they do not have enough reward points. |
| **BS58** | Points deduction | Reward points are deducted immediately when a voucher is redeemed. |

---

## 8. Staff & Shift Management

| Code | Rule Name | Content |
|:----:|:----------|:--------|
| **BS59** | Staff types | Staff members are classified as **Full-Time** or **Part-Time**. |
| **BS60** | Full-time shift duration | Full-time shifts must last exactly **8 hours**. |
| **BS61** | Part-time shift duration | Part-time shifts must last exactly **4 hours**. |
| **BS62** | Rotating shift flexibility | Rotating shifts have no fixed duration — they can be any length. |
| **BS63** | Part-time shift eligibility | Part-time staff can only register for part-time shifts (4h) or rotating shifts no longer than 4 hours. |
| **BS64** | Full-time shift eligibility | Full-time staff who register for a shift shorter than 8 hours must provide a written reason. |
| **BS65** | Cinema assignment | Staff can only register for shifts at the cinema they are assigned to. |
| **BS66** | Shift within operating hours | All shifts must be within the cinema's operating hours (6:00 AM to 2:00 AM). |
| **BS67** | No duplicate registration | A staff member cannot register for the same shift twice. |
| **BS68** | Shift approval | Shift registrations start as **Pending** and require manager or Admin approval. |
| **BS69** | Clock-in required | Staff must clock in at the start of their shift. |
| **BS70** | Clock-out required | Staff must clock out at the end of their shift. |
| **BS71** | Face registration | Staff can register their face for facial recognition-based clock-in. |
| **BS72** | Payroll calculation | Pay is calculated based on logged working hours and the staff member's hourly rate. |

---

## 9. Customer Comments & Reviews

| Code | Rule Name | Content |
|:----:|:----------|:--------|
| **BS73** | Comment moderation | Customer comments and reviews go through a **moderation** process before being published. |
| **BS74** | Comment ownership | A customer can only **edit** or **delete** their own comments. |
| **BS75** | Reply ownership | A customer can only **edit** or **delete** their own replies to comments. |
| **BS76** | Comment eligibility | Only customers who have watched a movie can post comments and ratings on that movie. |

---

## 10. Chatbot (Virtual Assistant)

| Code | Rule Name | Content |
|:----:|:----------|:--------|
| **BS77** | Chatbot topics | The chatbot can handle: movie lists, showtimes, bookings, cinema statistics, audit logs, and general FAQ. |
| **BS78** | Role-based chatbot access | Some chatbot features require the user to be logged in and have the correct role. The chatbot declines unauthorized requests. |
| **BS79** | Chatbot escalation | If the chatbot cannot understand the question, it directs the user to contact customer support. |

---

## 11. Admin Operations

| Code | Rule Name | Content |
|:----:|:----------|:--------|
| **BS80** | User management | Admin can view, add, block, or activate user accounts. |
| **BS81** | Role assignment | Admin can assign or remove roles for any user. |
| **BS82** | Rights transfer | Admin can transfer management rights from one person to another (e.g., transfer Theater Manager from staff A to staff B). |
| **BS83** | Background job monitoring | Admin can view and monitor background job execution and status. |
| **BS84** | Audit trail | All important actions are logged. Admin can view and search the audit log. |

---

## 12. System Operations

| Code | Rule Name | Content |
|:----:|:----------|:--------|
| **BS85** | Vietnam timezone | All times displayed to staff and customers use **Vietnam local time (UTC+7)**. |
| **BS86** | Three-language support | The system supports **English** (default), **Vietnamese** (UTF-8 with diacritics), and **Russian** (Cyrillic alphabet). |
| **BS87** | Data protection | Sensitive customer identity information must be protected before storage. |
| **BS88** | User data rights | Users have the right to access, edit, and request deletion of their personal data. |
| **BS89** | Cache freshness | Customer-facing data (movies, showtimes, etc.) must stay up to date after important business changes. |

---

## 13. Legal & Compliance

| Code | Rule Name | Content |
|:----:|:----------|:--------|
| **BS90** | Vietnamese film priority | Vietnamese film screenings are prioritized from **18:00 to 22:00**. |
| **BS91** | Under-13 screening hours | Screenings for customers under 13 must end **before 22:00**. |
| **BS92** | Under-16 screening hours | Screenings for customers under 16 must end **before 23:00**. |
| **BS93** | No recording | Customers must not illegally record movies in the theater. |
| **BS94** | No disruptive behavior | Customers must not cause disturbances or obstruct other customers. |
| **BS95** | No smoking | Tobacco and e-cigarettes are not permitted in the theater. |
| **BS96** | No weapons | Weapons, flammable materials, and toxic substances are prohibited. |
| **BS97** | No pets | Pets are not allowed in the cinema (except service animals). |
| **BS98** | No outside food | Outside food and drinks are not permitted without authorization. |
| **BS99** | Privacy commitment | Customer personal data is not sold or transferred to third parties without consent. |
| **BS100** | Cookie usage | The website uses cookies to improve user experience. Customers can manage cookie settings in their browser. |

---

## 14. Seat Layout Rules

| Code | Rule Name | Content |
|:----:|:----------|:--------|
| **BS101** | Auditorium must have seats | An auditorium must contain at least one seat. |
| **BS102** | Continuous rows | Seat rows must be filled continuously. A row cannot skip from position 1 to position 3 while position 2 is missing. |
| **BS103** | Continuous columns | Seat columns must be filled continuously without gaps in the middle. |
| **BS104** | No overlapping positions | Two seats cannot share the same grid position. |
| **BS105** | No duplicate labels | Two seats cannot have the same seat label in the same auditorium. |

---

## 15. Cashier Operations

| Code | Rule Name | Content |
|:----:|:----------|:--------|
| **BS106** | Counter sales | A Cashier can sell tickets at the cinema counter by selecting movie, showtime, and seats on behalf of the customer. |
| **BS107** | Customer lookup | A Cashier can look up a customer by email for counter sales. |
| **BS108** | Department POS access | Cashiers log in using the department's shared account to access the POS system. |
