using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Shifts;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Exceptions;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Utils;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Text.Json;

namespace Cinema.Application.UseCases.Staff;

public class RegisterFaceUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration _configuration;

    public RegisterFaceUseCase(IUnitOfWork unitOfWork, IConfiguration configuration)
    {
        _unitOfWork = unitOfWork;
        _configuration = configuration;
    }

    public async Task<BaseResponse<bool>> ExecuteAsync(Guid staffId, Guid operatorUserId, ReqRegisterFaceDto dto)
    {
        // 1. Kiểm tra xem người vận hành có quyền không (chính nhân viên, Admin hoặc Quản lý rạp của cùng chi nhánh)
        var staffProfile = await _unitOfWork.Repository<StaffProfileEntity>().Query()
            .FirstOrDefaultAsync(s => s.UserId == staffId && s.WorkingStatus);

        if (staffProfile == null)
        {
            throw new AppException("Tài khoản nhân viên không tồn tại hoặc đã ngừng hoạt động.", 404, "FACE_ERR");
        }

        if (operatorUserId != staffId)
        {
            // Nếu người thao tác không phải chính nhân viên đó, kiểm tra xem có phải Admin/Quản lý rạp không
            var isOperatorAdmin = await _unitOfWork.Repository<UserRoleInfoEntity>().Query()
                .AnyAsync(ur => ur.UserId == operatorUserId && ur.RoleListInfoEntity.RoleName == "Admin");

            if (!isOperatorAdmin)
            {
                var isOperatorManager = await _unitOfWork.Repository<UserRoleInfoEntity>().Query()
                    .AnyAsync(ur => ur.UserId == operatorUserId && ur.RoleListInfoEntity.RoleName == "TheaterManager");

                if (!isOperatorManager)
                {
                    throw new AppException("Bạn không có quyền đăng ký khuôn mặt cho nhân viên này.", 403, "FACE_ERR");
                }

                // Kiểm tra xem Quản lý rạp có cùng chi nhánh với nhân viên không
                var managerProfile = await _unitOfWork.Repository<StaffProfileEntity>().Query()
                    .FirstOrDefaultAsync(s => s.UserId == operatorUserId && s.WorkingStatus);

                if (managerProfile == null || managerProfile.CinemaId != staffProfile.CinemaId)
                {
                    throw new AppException("Bạn chỉ được phép đăng ký khuôn mặt cho nhân viên thuộc chi nhánh rạp của mình.", 403, "FACE_ERR");
                }
            }
        }

        if (dto.FaceVector == null || dto.FaceVector.Length != 128)
        {
            throw new AppException("Dữ liệu Face Vector không hợp lệ (yêu cầu mảng 128 số thực).", 400, "FACE_ERR");
        }

        // 2. Chuyển mảng float[] thành chuỗi JSON
        var vectorJson = JsonSerializer.Serialize(dto.FaceVector);

        // 3. Mã hóa chuỗi JSON này bằng AES-256
        var aesKey = _configuration["AES_256:Key"];
        var aesIv = _configuration["AES_256:IV"];

        if (string.IsNullOrEmpty(aesKey) || string.IsNullOrEmpty(aesIv))
        {
            throw new AppException("Lỗi hệ thống: Chưa cấu hình khóa bảo mật AES-256.", 500, "FACE_ERR");
        }

        var encryptedVector = AES256Helper.Encrypt(vectorJson, aesKey, aesIv);

        // 4. Lưu vào StaffProfileEntity
        staffProfile.FaceVector = encryptedVector;
        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = "Đăng ký nhận diện khuôn mặt thành công."
        };
    }
}
