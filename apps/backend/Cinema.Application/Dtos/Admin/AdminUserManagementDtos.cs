using System;
using System.Collections.Generic;
using Cinema.Domain.Enums;

namespace Cinema.Application.Dtos.Admin;

public class AdminUserDto
{
    public Guid UserId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string? PortraitImageUrl { get; set; }
    public string UserRoles { get; set; } = string.Empty;
    public AccountStatusEnum AccountStatus { get; set; }
    public RegisterMethodEnum RegisterMethod { get; set; }
    public string? CinemaName { get; set; }
}

public class AdminCreateUserRequestDto
{
    public string UserEmail { get; set; } = string.Empty;
    public string UserPassword { get; set; } = string.Empty;
    public string UserRepassword { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string IdentityCode { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public List<Guid> RoleIds { get; set; } = [];
    public Guid? CinemaId { get; set; }
    public Guid? DepartmentId { get; set; }
    public float[]? FaceVector { get; set; }
    public EmployeeWorkType? EmployeeType { get; set; }
}

public class AdminCreateUserResponseDto
{
    public Guid UserId { get; set; }
}

public class ResponsePermissionDto
{
    public Guid PermissionId { get; set; }
    public string PermissionInfo { get; set; } = string.Empty;
}

public class ResponseRolePermissionsDto
{
    public Guid RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public List<ResponsePermissionDto> Permissions { get; set; } = [];
}
