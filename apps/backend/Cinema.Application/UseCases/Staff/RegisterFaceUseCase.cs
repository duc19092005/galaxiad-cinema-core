using Cinema.Application.Abstractions.Security;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Shifts;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces.Staff;
using Microsoft.Extensions.Configuration;
using System.Text.Json;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Staff;

public class RegisterFaceUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStaffRepository _repository;
    private readonly IConfiguration _configuration;
    private readonly IEncryptionService _encryptionService;

    public RegisterFaceUseCase(IStaffRepository repository, IConfiguration configuration,
        IUnitOfWork unitOfWork,
        IEncryptionService encryptionService)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _configuration = configuration;
        _encryptionService = encryptionService;
    }

    public async Task<BaseResponse<bool>> ExecuteAsync(Guid staffId, Guid operatorUserId, ReqRegisterFaceDto dto)
    {
        // 1. Kiểm tra xem người vận hành có quyền không (chính nhân viên, Admin hoặc Quản lý rạp của cùng chi nhánh)
        var staffProfile = await _repository.GetActiveStaffProfileAsync(staffId);

        if (staffProfile == null)
        {
            throw new AppException(Messages.Staff.StaffProfileNotFound, 404, "FACE_ERR");
        }

        if (operatorUserId != staffId)
        {
            // Nếu người thao tác không phải chính nhân viên đó, kiểm tra xem có phải Admin/Quản lý rạp không
            var isOperatorAdmin = await _repository.UserHasRoleAsync(operatorUserId, "Admin");

            if (!isOperatorAdmin)
            {
                var isOperatorManager = await _repository.UserHasRoleAsync(operatorUserId, "TheaterManager");

                if (!isOperatorManager)
                {
                    throw new AppException(Messages.Staff.NoPermissionFaceRegister, 403, "FACE_ERR");
                }

                // Kiểm tra xem Quản lý rạp có cùng chi nhánh với nhân viên không
                var managerProfile = await _repository.GetActiveStaffProfileAsync(operatorUserId);

                if (managerProfile == null || managerProfile.CinemaId != staffProfile.CinemaId)
                {
                    throw new AppException(Messages.Staff.NoPermissionBranchFaceOnly, 403, "FACE_ERR");
                }
            }
        }

        if (dto.FaceVector == null || dto.FaceVector.Length != 128)
        {
            throw new AppException(Messages.Staff.FaceVectorInvalid, 400, "FACE_ERR");
        }

        // 2. Chuyển mảng float[] thành chuỗi JSON
        var vectorJson = JsonSerializer.Serialize(dto.FaceVector);

        // 3. Mã hóa chuỗi JSON này bằng AES-256
        var aesKey = _configuration["AES_256:Key"];
        var aesIv = _configuration["AES_256:IV"];

        if (string.IsNullOrEmpty(aesKey) || string.IsNullOrEmpty(aesIv))
        {
            throw new AppException(Messages.Staff.MissingAESConfig, 500, "FACE_ERR");
        }

        var encryptedVector = _encryptionService.Encrypt(vectorJson, aesKey, aesIv);

        // 4. Lưu vào StaffProfileEntity
        staffProfile.FaceVector = encryptedVector;
        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = Messages.Staff.RegisterFaceSuccess
        };
    }
}
