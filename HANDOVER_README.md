# Handover README - Cinema Backend Refactoring

**Current Branch:** `feature/refactor-schema` (Already pushed to remote origin)

This document provides a highly detailed specification of the database schema refactoring, permission-based authorization, shift management, and facial recognition attendance features to ensure a smooth handover to the next agent.

---

## 1. Summary of DB Schema & Entity Refactoring

We have completely refactored the database schema to eliminate the redundant `UserProfileEntity` table and introduce a flexible RBAC (Role-Based Access Control) system, alongside shift, payroll, and staff profile tables.

### A. The User Schema Consolidation
*   **Deleted Table**: `UserProfileEntity` (previously configured as a 1-to-1 relationship with `UserInfoEntity`).
*   **Merged Fields**: The following personal details columns are now added **directly** to `UserInfoEntity` (stored in the `UserInfoEntity` table):
    *   `UserName` (`nvarchar(100)`, Required)
    *   `IdentityCode` (`varchar(200)`, Required) - *Encrypted with AES-256*
    *   `DateOfBirth` (`datetime2`, Required)
    *   `PhoneNumber` (`char(10)`, Required)
*   **New 1-to-1 Relationships**:
    *   `UserInfoEntity.StaffProfileEntity` (nullable, navigation property to `StaffProfileEntity`)
    *   `UserInfoEntity.CustomerProfileEntity` (nullable, navigation property to `CustomerProfileEntity`)

### B. New Entities & Fields Added

#### 1. `PermissionEntity` & `PermissionForRoleEntity` (RBAC)
*   `PermissionEntity` contains system permission strings:
    *   `PermissionId` (Guid, Primary Key)
    *   `PermissionInfo` (`nvarchar(100)`, e.g., `"ViewCinema"`, `"ApproveShift"`, `"ClockIn"`)
*   `PermissionForRoleEntity` (Composite Primary Key: `PermissionId`, `RoleId`):
    *   Maps Permissions to Roles.
    *   **Seed Data (already in `PermissionsSeedData.cs`)**:
        *   `Admin` -> Receives all 23 permissions.
        *   `TheaterManager` -> `ApproveShift`, `ManageStaffProfiles`, `ViewPayroll`, `ViewAuditLogs`, `ViewCinema`, `ViewAuditorium`, `ViewMovie`, `ViewSchedule`, `ManageSchedule`.
        *   `Cashier` -> `SellTicket`, `BookTicket`, `ViewHistory`, `ClockIn`, `ClockOut`, `RegisterShift`, `ViewCinema`, `ViewSchedule`, `ViewPayroll`.
        *   `FacilitiesManager` -> `ViewCinema`, `ManageCinema`, `ViewAuditorium`, `ManageAuditorium`, `ManageFormats`, `ManageSurcharges`, `ViewAuditLogs`.
        *   `MovieManager` -> `ViewMovie`, `ManageMovie`, `ViewSchedule`, `ViewAuditLogs`.
        *   `Customer`/`VIP`/`Student` -> `BookTicket`, `ViewHistory`, `ViewCinema`, `ViewMovie`, `ViewSchedule`.

#### 2. `StaffProfileEntity`
*   Extends `UserInfoEntity` via 1-to-1 relationship.
*   **Fields**:
    *   `UserId` (Guid, Primary Key, Foreign Key to `UserInfoEntity`)
    *   `WorkingStatus` (`bool`, default `true` - active)
    *   `CinemaId` (Guid, Foreign Key to `CinemaInfoEntity`) - binds the staff to a specific cinema theater.
    *   `IsCinemaManager` (`bool`, default `false` - indicates if they manage this specific cinema).
    *   `FaceVector` (`nvarchar(max)`, Nullable) - *Stores the 128-float vector extracted by Frontend, encrypted via AES-256*.

#### 3. `CustomerProfileEntity`
*   Extends `UserInfoEntity` via 1-to-1 relationship.
*   **Fields**:
    *   `UserId` (Guid, Primary Key, Foreign Key to `UserInfoEntity`)
    *   `TotalPoint` (`decimal(18,2)`, default `0`).

#### 4. `CinemaShiftTemplateEntity` (Mẫu Ca Làm Việc)
*   **Fields**:
    *   `ShiftTemplateId` (Guid, Primary Key)
    *   `CinemaId` (Guid, Foreign Key to `CinemaInfoEntity`)
    *   `ShiftName` (`nvarchar(50)`, e.g., `"Morning Shift"`, `"Evening Shift"`)
    *   `StartTime` (`TimeSpan`, e.g., `08:00:00`)
    *   `EndTime` (`TimeSpan`, e.g., `16:00:00`)
    *   `MaxStaff` (`int`, default `2` - maximum allowed staff per shift)
    *   `RoleId` (Guid, Foreign Key to `RoleListInfoEntity` - type of staff needed, e.g., Cashier)
    *   `IsActive` (`bool`, default `true`)

#### 5. `StaffShiftRegistrationEntity` (Đăng Ký Ca Làm)
*   **Fields**:
    *   `ShiftRegistrationId` (Guid, Primary Key)
    *   `StaffId` (Guid, Foreign Key to `StaffProfileEntity`)
    *   `ShiftTemplateId` (Guid, Foreign Key to `CinemaShiftTemplateEntity`)
    *   `RegistrationDate` (`DateTime` - date of the shift)
    *   `Status` (`varchar(20)`, default `"Pending"` - possible values: `"Pending"`, `"Approved"`, `"Rejected"`)
    *   `ApprovedByUserId` (Guid, Nullable, Foreign Key to `UserInfoEntity` - the Admin or TheaterManager who approved/rejected it)
    *   `ApprovedAt` (`DateTime`, Nullable)
    *   `Notes` (`nvarchar(500)`, Nullable)
*   **Constraint**: Unique composite index on `(StaffId, ShiftTemplateId, RegistrationDate)` to prevent duplicate registrations for the same shift/day.

#### 6. `StaffWorkingLoggerEntity` (Nhật Ký Chấm Công)
*   **Fields**:
    *   `StaffWorkingLoggerId` (Guid, Primary Key)
    *   `StaffId` (Guid, Foreign Key to `StaffProfileEntity`)
    *   `RoleId` (Guid, Foreign Key to `RoleListInfoEntity` - role performed during the shift)
    *   `SalaryPerHour` (`decimal(18,2)` - hourly wage captured at the time of clock-in)
    *   `WorkingHour` (`decimal(18,2)` - calculated when clocked out: `(EndedShiftTime - StartedShiftTime).TotalHours`)
    *   `StartedShiftTime` (`DateTime` - actual clock-in time)
    *   `EndedShiftTime` (`DateTime`, Nullable - actual clock-out time)
    *   `WorkingDate` (`DateTime` - date of shift)
    *   `TotalReceived` (`decimal(18,2)` - calculated upon clock-out: `WorkingHour * SalaryPerHour`)
    *   `SalaryTotalLoggerId` (Guid, Nullable, Foreign Key to `StaffSalaryTotalLoggerEntity`)
*   **Constraint**: Unique composite index on `(StaffId, StartedShiftTime)`.

#### 7. `StaffSalaryTotalLoggerEntity` (Bảng Lương / Thanh Toán)
*   **Fields**:
    *   `SalaryTotalLoggerId` (Guid, Primary Key)
    *   `TotalReceived` (`decimal(18,2)` - sum of working logs paid in this batch)
    *   `ReceivedDay` (`DateTime` - payment date)
    *   `StaffId` (Guid, Foreign Key to `StaffProfileEntity`)
    *   `PaidByUserId` (Guid, Nullable, Foreign Key to `UserInfoEntity` - Admin processing the payroll)
    *   `PaymentStatus` (`varchar(30)`, default `"Pending"` - `"Pending"`, `"Paid"`)

#### 8. Modified Existing Entities
*   `RoleListInfoEntity`: Added `SalaryPerHour` (`decimal(18,2)`) and `DiscountPercent` (`decimal(18,2)`).
*   `OrderDetailsInfo`: Added `FullName` (`nvarchar(100)`, Nullable) and `IdentityCodeHash` (`varchar(200)`, Nullable) to capture details at booking time for guest checkouts.

---

## 3. Implemented Service Files & Fixes
We have modified the following services in the business layer to use the new direct fields on `UserInfoEntity` instead of searching/including the deleted `UserProfileEntity`:
*   `BookingService.cs`
*   `AuditLogService.cs`
*   `ManagementDashboardService.cs`
*   `AdminManageUserService.cs`
*   `AdminManagementTransferService.cs`

---

## 4. Immediate Tasks for the Incoming Agent

### Task A: Fix compilation errors in UseCases & Validators
Open these files and change references from `UserProfileEntity` (e.g. `user.UserProfileEntity.UserName`) to direct properties on `UserInfoEntity` (e.g. `user.UserName`).
1.  `BusinessLayer/UseCases/FacilitiesManager/Cinemas/ReadCinemaUsecase.cs`
2.  `BusinessLayer/UseCases/IdentityAccess/GoogleLoginUseCase.cs`
    - In `GoogleLoginUseCase.cs` around line 215, remove `_dbContext.UserProfileEntity.AddAsync` and set `UserName`, `IdentityCode`, `DateOfBirth`, `PhoneNumber` directly in the `UserInfoEntity` constructor.
3.  `BusinessLayer/UseCases/IdentityAccess/LoginRegularUseCase.cs`
    - Change query getting `Username` from `UserProfileEntity` to fetching it from the local `user.UserName`.
4.  `BusinessLayer/UseCases/IdentityAccess/RegisterRegularUseCase.cs`
    - Around line 85, remove `_dbContext.UserProfileEntity.AddAsync`. Instead, initialize those properties directly in `new UserInfoEntity { ... }`.
5.  `BusinessLayer/UseCases/IdentityAccess/UserProfileUseCase.cs`
6.  `BusinessLayer/UseCases/MovieManager/MovieInfos/ReadMovieInfosUseCase.cs`
7.  `BusinessLayer/UseCases/TheaterManager/Auditoriums/ReadAuditorium.cs`
8.  `BusinessLayer/Validators/IdentityAccess/RegisterValidate.cs`

### Task B: Register HttpContextAccessor
In `ApiLayer/Program.cs`, add `builder.Services.AddHttpContextAccessor();` so the database context can automatically resolve logged-in user claims for audit logs.

### Task C: Add EF Migration
Once the project builds successfully:
```bash
dotnet ef migrations add InitialRefactoredSchema --project DataAccess --startup-project ApiLayer
dotnet ef database update --project DataAccess --startup-project ApiLayer
```

---

## 5. Specifications for Upcoming Feature Implementation

### Feature 1: Shift Registration with Redis Distributed Locking (Race Condition Avoidance)
*   **Goal**: Staff registers for a shift template (`CinemaShiftTemplateEntity`) for a specific date. We must avoid race conditions where multiple staff register concurrently and exceed `MaxStaff`.
*   **Algorithm**:
    1.  When a registration request arrives (containing `ShiftTemplateId` and `RegistrationDate`):
    2.  Acquire a Redis Lock using key: `lock:shift:{ShiftTemplateId}:{RegistrationDate:yyyyMMdd}` using `SET key value NX PX 5000` (5-second expiration).
    3.  If lock acquisition fails, return `409 Conflict` (Please try again).
    4.  Within the lock:
        *   Count approved registrations for this shift template on this date.
        *   If `count >= MaxStaff`, return `400 Bad Request` ("Ca làm việc đã đầy").
        *   Create the `StaffShiftRegistrationEntity` with `Status = "Pending"`.
    5.  Release the lock.
*   **Approval**: Admin or `TheaterManager` (linked to the same cinema: `StaffProfile.CinemaId == Manager.CinemaId` or Admin) can approve. Once approved, the status transitions to `"Approved"`.

### Feature 2: Face Recognition Attendance System (Clock-in / Clock-out)
*   **Enrollment**: Admin uploads a portrait image of the employee. The Frontend extracts the 128-float face vector using `face-api.js` and sends it as an array to `POST /api/staff/register-face`.
*   **BE Storage**:
    *   Take the float array, serialize it to a string (or JSON string).
    *   Encrypt this string using `AES256Helper` and store it in `StaffProfileEntity.FaceVector`.
*   **Verification (Clock-In Flow)**:
    *   The staff attempts to clock-in by capturing their face. FE sends the current extracted 128-float vector to `POST /api/staff/clock-in`.
    *   BE retrieves the encrypted `FaceVector` from `StaffProfileEntity`.
    *   Decrypt the vector and parse it back to a `float[]`.
    *   Calculate the **Euclidean Distance** between the stored vector $A$ and the query vector $B$:
        $$d = \sqrt{\sum_{i=1}^{128} (A_i - B_i)^2}$$
    *   Accept matching if $d \le 0.6$ (threshold).
*   **Shift constraint checking**:
    *   To successfully clock in, the system checks if the current time matches an `"Approved"` shift registration for the staff for **today**.
    *   **Time Simulation Support (For teacher demo)**: Implement a mechanism (e.g. accepting a simulated request header `X-Simulated-Time` or query param `simulatedTime` when running in `Development` environment) that overrides the server's clock `DateTime.UtcNow`. This allows instructors to test clock-ins for future shifts without having to wait.
