# Galaxiad Cinema - Business Rules Reference

This document explains the main business rules used by Galaxiad Cinema in simple operational language. It is written for managers, operators, product owners, and stakeholders who need to understand how the system should behave without reading the source code.

---

## Core Business Rules

| No. | Business Area | Rule | Plain Business Explanation |
| :---: | :--- | :--- | :--- |
| **1** | Accounts & Access | Role-based access | Each user has a role such as customer, staff, manager, or administrator. Users can only see and perform actions that match their role. |
| **2** | Staff Management | Staff work type | Staff members are classified as full-time or part-time. This affects which work shifts they can register for. |
| **3** | Customer Privacy | Identity protection | Sensitive customer identity information must be protected before it is stored. |
| **4** | Cinema Operations | Operating hours | A cinema can schedule work shifts only within the official operating window, from 6:00 AM to 2:00 AM the next day. |
| **5** | Cinema Operations | Local time consistency | Business times shown to staff and customers must follow Vietnam local time. |
| **6** | Shift Planning | Standard shift duration | Full-time shifts must last exactly 8 hours. Part-time shifts must last exactly 4 hours. |
| **7** | Shift Registration | Staff shift eligibility | Part-time staff can only register for shorter shifts. Full-time staff who register for a shorter shift must provide a reason. |
| **8** | Seat Reservation | Temporary seat holding | When a customer selects seats, those seats are held temporarily during checkout. If payment is not completed in time, the seats become available again. |
| **9** | Ticket Purchase | Paid ticket confirmation | A ticket is only considered valid after successful payment. Ticket download is only available for paid bookings. |
| **10** | Ticket Pricing | Special ticket prices | Some customer groups, such as students, may receive special fixed ticket prices when eligible. |
| **11** | Ticket Pricing | Discounts and surcharges | Discounts and surcharges can be applied based on business campaigns, movie format, seat type, holidays, or weekends. |
| **12** | Ticket Pricing | Premium experiences | Premium seat types or special movie formats may increase the final ticket price. |
| **13** | Vouchers & Loyalty | Voucher redemption | Customers can redeem vouchers using loyalty points. Some vouchers may only be available to specific customer groups. |
| **14** | Reviews & Comments | Customer ownership | Customers can only edit or delete their own comments and reviews. |
| **15** | System Performance | Fresh business data | Customer-facing lists, movie details, booking history, and profiles should stay up to date after important business changes. |
| **16** | Facility Management | Complete seat layout | An auditorium seat map must be complete. A row or column cannot have unexpected empty gaps in the middle of the layout. |
| **17** | Facility Management | Unique seats | Every seat in an auditorium must have a unique position and a unique seat label. |
| **18** | Ticket Purchase | Ticket quantity limit | A customer can buy from 1 to 10 tickets in a single order. Orders outside this range are not allowed. |
| **19** | Ticket Purchase | Avoid single-seat gaps | Customers should not be allowed to choose seats in a way that leaves one lonely empty seat between occupied seats. |
| **20** | Customer Experience | Language support | Customer-facing messages should be clear and available in supported languages when requested. |

---

## Seat Layout Rules

When a facilities manager creates or updates an auditorium, the seat map must look like a complete seating plan.

In business terms:

- The auditorium must have seats.
- Seat rows and columns must be continuous.
- There should not be missing seat positions inside the normal seating area.
- Two seats cannot share the same position.
- Two seats cannot have the same seat label, such as two seats both named `A1`.

Why this matters:

A complete and consistent seat map helps customers choose seats easily, helps staff manage auditoriums correctly, and prevents confusing booking situations.

Example:

If a room is designed as 10 seats per row, then a row should not skip from `A1` to `A3` while `A2` is missing. The seat map must be filled consistently.

---

## Ticket Booking Rules

Customers can select and pay for a maximum of 10 tickets in one order.

In business terms:

- A customer must select at least one seat.
- A customer cannot select more than 10 seats in one order.
- The same seat cannot be selected twice.
- Seats that are already paid for or temporarily held by another customer cannot be selected.

Why this matters:

This keeps checkout manageable, reduces misuse, and keeps seat availability fair for other customers.

---

## Avoiding Lonely Single Seats

The booking system should reduce cases where one empty seat is left alone between occupied seats.

In business terms:

- Customers are encouraged to choose seats that keep useful pairs or groups available.
- If a customer's selection would leave only one isolated empty seat in a row, the system should ask them to choose an adjacent seat or another row.

Example:

Suppose a row has seats `A1` to `A10`.

- If several middle seats are already taken, the system may still allow a customer to buy a single seat at the edge.
- But if choosing a seat would leave one empty seat trapped between occupied seats, the system should reject that selection.

Why this matters:

Single leftover seats are harder to sell, especially because many customers come in pairs or groups. This rule helps protect future sales and improves seat availability for later customers.

---

## Language And Message Rules

The system should show clear, professional messages to users.

In business terms:

- Default messages should be in English.
- If the frontend requests Vietnamese, messages should appear in proper Vietnamese with accents.
- If the frontend requests Russian, messages should appear in proper Cyrillic Russian.
- Error messages and success messages should follow the same language rule.

Why this matters:

Consistent language makes the product easier to use and avoids confusing mixed-language or broken-text messages.
