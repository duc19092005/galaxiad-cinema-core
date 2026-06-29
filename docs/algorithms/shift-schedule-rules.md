# Shift Scheduling Rules & Constraints

This document describes the validation rules, shift categorization algorithms, and timezone normalization strategies applied to staff shifts at Galaxiad Cinema.

---

## 1. Shift Categorization (Shift Types)

The cinema management portal classifies cashier and staff shifts into three categories with strict duration boundaries:

1. **Full-time Shift (Exactly 8 Hours)**:
   - The duration must equal exactly 8 hours (`EndTime - StartTime == 8 hours`).
   - Overnight shifts are supported (crossing the midnight boundary).
   - In the frontend management interface, the end time selector is automatically locked and auto-calculated based on the start time to prevent scheduling errors.

2. **Part-time Shift (Exactly 4 Hours)**:
   - The duration must equal exactly 4 hours (`EndTime - StartTime == 4 hours`).
   - The end time selector is locked and auto-calculated based on the start time.

3. **Rotating Shift (Flexible Hours)**:
   - Allows flexible start and end times with no strict duration constraints.

---

## 2. Cinema Operating Hours Validation (06:00 - 02:00 Next Day)

Galaxiad Cinema branches operate from **06:00 AM** on the current day until **02:00 AM** the next day (Vietnam local time, UTC+7). All staff shift times must fall entirely within this window.

### Validation Algorithm
For a shift starting at `Start` and ending at `End`:
1. Convert input times to Vietnam Local Time (UTC+7).
2. Extract the local starting date (`Date`).
3. Define the lower boundary: `MinLimit = Date + 06:00`.
4. Define the upper boundary: `MaxLimit = Date + 1 Day + 02:00` (2:00 AM of the next day).
5. Validate the boundaries:
   $$\text{MinLimit} \le \text{Start} \le \text{MaxLimit}$$
   $$\text{MinLimit} \le \text{End} \le \text{MaxLimit}$$
6. If any boundary check fails, both the frontend and backend block the request and return a validation error.

---

## 3. Shift Registration Eligibility (Staff Constraints)

To optimize labor costs and respect staff contract types, the backend (`RegisterShiftUseCase.cs`) enforces the following registration filters:
- **Part-Time Staff**:
  - May only register for Part-time shifts (4 hours) or Rotating shifts that do not exceed 4 hours.
  - Attempting to register for Full-time shifts or Rotating shifts longer than 4 hours is rejected.
- **Full-Time Staff**:
  - Encouraged to register for Full-time shifts (8 hours).
  - Registering for a short shift (< 8 hours) is allowed only if a justification is provided in the `Notes` field. Otherwise, registration is blocked.

---

## 4. Timezone Normalization

Because the platform operates in a distributed environment, dates and times are normalized as follows:
- **Client (Frontend)**: Interacts with dates and times in Vietnam local time (UTC+7).
- **Backend (API)**:
  - **Database Persistence**: Converts all incoming local times to UTC using the `DateTimeHelper.NormalizeIncoming` utility before saving.
  - **API Responses**: Converts database UTC timestamps back to Vietnam Local Time (UTC+7) using the `DateTimeHelper.ToVietnamTime` utility before rendering, ensuring cashiers see accurate schedules.
