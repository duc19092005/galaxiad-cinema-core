using System;
using System.Threading.Tasks;
using Cinema.Application.Constants;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.FacilitiesManager.Cinemas.Requests;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.IIdentityAccess;
using Cinema.Domain.Enums;
using Cinema.Application.Exceptions;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Utils;

namespace Cinema.Application.UseCases.FacilitiesManager.Cinemas;

public class CreateDepartmentUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDepartmentRepository _departmentRepository;
    private readonly IUserContextService _userContext;
    private readonly IPasswordHasher _passwordHasher;

    public CreateDepartmentUseCase(
        IUnitOfWork unitOfWork,
        IDepartmentRepository departmentRepository,
        IUserContextService userContext,
        IPasswordHasher passwordHasher)
    {
        _unitOfWork = unitOfWork;
        _departmentRepository = departmentRepository;
        _userContext = userContext;
        _passwordHasher = passwordHasher;
    }

    public async Task<BaseResponse<Guid>> ExecuteAsync(CreateDepartmentReqDto request)
    {
        var userId = _userContext.GetUserId();
        var isAdmin = _userContext.IsInRole("Admin");

        // Validate cinema
        var cinema = await _departmentRepository.FindCinemaAsync(request.CinemaId);
        if (cinema == null)
            throw new AppException("Không tìm thấy rạp phim.", 404, "DEPT_ERR");

        // Check permission
        if (!isAdmin && cinema.FacilitiesManagerId != userId)
            throw new AppException("Bạn không có quyền tạo phòng ban cho rạp này.", 403, "DEPT_ERR");

        // Check unique name per cinema
        var exists = await _departmentRepository.DepartmentExistsAsync(request.CinemaId, request.DepartmentName);
        if (exists)
            throw new AppException($"Phòng ban '{request.DepartmentName}' đã tồn tại trong rạp này.", 400, "DEPT_ERR");

        var departmentId = Guid.NewGuid();
        var sharedUserId = Guid.NewGuid();
        var email = $"{request.CashierType.ToString().ToLower()}_{departmentId:N}@cinema.com";
        const string defaultPassword = "123456";

        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            // 1. Create shared user account
            var sharedUser = new UserInfoEntity
            {
                UserId = sharedUserId,
                UserEmail = email,
                Password = _passwordHasher.Hash(defaultPassword),
                RegisterMethod = RegisterMethodEnum.UsernamePassword,
                AccountStatus = AccountStatusEnum.Active,
                DateOfBirth = new DateTime(2000, 1, 1),
                IdentityCode = $"DEPT_{departmentId:N}",
                PhoneNumber = cinema.CinemaHotLineNumber,
                UserName = $"{request.DepartmentName} - {cinema.CinemaName}"
            };
            await _unitOfWork.Repository<UserInfoEntity>().AddAsync(sharedUser);

            // 2. Assign Cashier role
            await _unitOfWork.Repository<UserRoleInfoEntity>().AddAsync(new UserRoleInfoEntity
            {
                UserId = sharedUserId,
                RoleId = userRoles.Cashier
            });

            // 3. Create StaffProfile for the shared account
            await _unitOfWork.Repository<StaffProfileEntity>().AddAsync(new StaffProfileEntity
            {
                UserId = sharedUserId,
                CinemaId = request.CinemaId,
                DepartmentId = departmentId,
                WorkingStatus = true,
                IsCinemaManager = false
            });

            // 4. Create Department
            await _unitOfWork.Repository<DepartmentEntity>().AddAsync(new DepartmentEntity
            {
                DepartmentId = departmentId,
                CinemaId = request.CinemaId,
                DepartmentName = request.DepartmentName,
                DepartmentType = request.DepartmentType,
                CashierType = request.CashierType,
                SharedUserId = sharedUserId,
                IsActive = true
            });

            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();

            return new BaseResponse<Guid>
            {
                IsSuccess = true,
                Data = departmentId,
                Message = $"Tạo phòng ban '{request.DepartmentName}' thành công. Tài khoản quầy: {email} / Mật khẩu: {defaultPassword}"
            };
        }
        catch (AppException) { await transaction.RollbackAsync(); throw; }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            throw new AppException($"Lỗi khi tạo phòng ban: {ex.Message}", 500, "S01");
        }
    }
}
