# Handover README - Cinema Backend Refactoring

**Current Branch:** `feature/refactor-schema` (Already pushed to remote origin)

This document outlines the progress made on the database schema refactoring, permission-based authorization, shift management, and facial recognition attendance features.

---

## 1. What Has Been Completed

### Database Schema Refactoring & RBAC
1. **Created 8 New Entities**:
   - `PermissionEntity.cs` & `PermissionForRoleEntity.cs`: Permission-based RBAC mapping.
   - `StaffProfileEntity.cs`: Extends `UserInfoEntity` for staff-specific properties (CinemaId, WorkingStatus, FaceVector).
   - `CustomerProfileEntity.cs`: Extends `UserInfoEntity` for customer-specific properties (TotalPoint).
   - `CinemaShiftTemplateEntity.cs` & `StaffShiftRegistrationEntity.cs`: Handles cinema shifts configuration and staff registration workflow.
   - `StaffWorkingLoggerEntity.cs` & `StaffSalaryTotalLoggerEntity.cs`: Handles clock-in/out logs, working hours, hourly salary rates, and payroll/payout tracking.
2. **Removed `UserProfileEntity`**:
   - Merged personal fields (`UserName`, `IdentityCode`, `DateOfBirth`, `PhoneNumber`) directly into `UserInfoEntity`.
   - Deleted `UserProfileEntity.cs`, `UserProfileRelationshipsKeys.cs`.
   - Updated `UserInfoRelationshipsKeys.cs` and `UserInfoSeedData.cs` accordingly.
3. **Automated Audit Logging**:
   - Registered `IHttpContextAccessor` in `CinemaDbContext` constructor.
   - Overrode `SaveChangesAsync` in `CinemaDbContext.cs` to capture added/modified/deleted entities and log changes at the field level automatically under `AuditLogEntity`.
4. **Seed Data**:
   - Created `userPermissions.cs` constants (23 GUIDs for system permissions).
   - Created `PermissionsSeedData.cs` seeding permissions and mapping them to roles (Admin gets all, Managers get specific scopes, Cashier, Customer, VIP, Student get their respective scopes).
5. **Fixed Business Layer Services**:
   - Fixed all references to `UserProfileEntity` in `BookingService.cs`, `AuditLogService.cs`, `ManagementDashboardService.cs`, `AdminManageUserService.cs`, and `AdminManagementTransferService.cs`.

---

## 2. Immediate Next Steps (Pending Completion)

### A. Fix Remaining Compilation Errors
The subagent got rate-limited before completing the UseCases and Validators. You need to modify the following files to replace `UserProfileEntity` properties with the merged `UserInfoEntity` properties:

1. `BusinessLayer/UseCases/FacilitiesManager/Cinemas/ReadCinemaUsecase.cs`
   - Replace `TheaterManager.UserProfileEntity.UserName` -> `TheaterManager.UserName`
   - Replace `FacilitiesManager.UserProfileEntity.UserName` -> `FacilitiesManager.UserName`
2. `BusinessLayer/UseCases/IdentityAccess/GoogleLoginUseCase.cs`
   - Remove `.Include(u => u.UserProfileEntity)`
   - Set the personal fields (`UserName`, `IdentityCode`, `DateOfBirth`, `PhoneNumber`) directly on `UserInfoEntity` creation instead of creating `UserProfileEntity`.
3. `BusinessLayer/UseCases/IdentityAccess/LoginRegularUseCase.cs`
   - In `Username = _dbContext.UserProfileEntity...`, change it to read directly from the fetched `user.UserName`.
4. `BusinessLayer/UseCases/IdentityAccess/RegisterRegularUseCase.cs`
   - Remove `_dbContext.UserProfileEntity.AddAsync(...)` creation. Set the personal fields directly on `UserInfoEntity` during creation.
5. `BusinessLayer/UseCases/IdentityAccess/UserProfileUseCase.cs`
   - Change `_dbContext.UserProfileEntity...` queries to query `_dbContext.UserInfoEntity...` or fetch directly from the user object.
6. `BusinessLayer/UseCases/MovieManager/MovieInfos/ReadMovieInfosUseCase.cs`
   - Change `Creator.UserProfileEntity.UserName` -> `Creator.UserName`
   - Change `Updater.UserProfileEntity.UserName` -> `Updater.UserName`
   - Change `MovieManager.UserProfileEntity.UserName` -> `MovieManager.UserName`
7. `BusinessLayer/UseCases/TheaterManager/Auditoriums/ReadAuditorium.cs`
   - Remove `.ThenInclude(u => u.UserProfileEntity)`
   - Change `TheaterManager.UserProfileEntity.UserName` -> `TheaterManager.UserName`
   - Change `FacilitiesManager.UserProfileEntity.UserName` -> `FacilitiesManager.UserName`
8. `BusinessLayer/Validators/IdentityAccess/RegisterValidate.cs`
   - Change `context.UserProfileEntity.Any(...)` -> `context.UserInfoEntity.Any(...)`

### B. Register HttpContextAccessor
In `ApiLayer/Program.cs`, add:
```csharp
builder.Services.AddHttpContextAccessor();
```
This is required for the automated audit logger to fetch the logged-in User's Claims.

### C. Create Database Migration
Since old migrations and snapshot have been deleted to clean up the schema, once compilation errors are resolved, run:
```bash
dotnet ef migrations add InitialRefactoredSchema --project DataAccess --startup-project ApiLayer
dotnet ef database update --project DataAccess --startup-project ApiLayer
```

### D. Permission-Based Auth (JWT)
1. Add Permission-based authorization handlers/middleware.
2. Read the user's roles -> resolve permissions -> check against requirements on controllers.
3. Update JWT generation to embed user roles/permissions.

### E. Shift Registration & Redis Locks
1. Implement registration endpoint for staff ca làm.
2. Prevent race conditions by securing the registration endpoint with a Redis-based Distributed Lock (`SET NX`) on `ShiftTemplateId`.
3. Implement Approval/Rejection endpoints for Admin / TheaterManager.

### F. Face Recognition Attendance (AES Vector)
1. Face vectors are retrieved on FE and sent to BE as a `float[]` array of size 128.
2. Encrypt the vector using `AES256Helper` before saving to `StaffProfileEntity.FaceVector`.
3. For Clock-in: Retrieve the stored vector, decrypt it, calculate the Euclidean distance against the incoming vector, and verify if the distance is below a threshold (e.g., 0.6).
4. Strictly enforce shift schedule matching for clock-ins, with a time simulation support toggled on/off for easy grading/demos.
