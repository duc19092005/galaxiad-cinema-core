using Shared.Enums;

namespace BusinessLayer.Dtos.Admin.Responses;

public class AdminTransferUserDto
{
    public Guid UserId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
}

public class ManagedItemDto
{
    public Guid ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ManagerName { get; set; } = string.Empty;
}

public class TransferManagementReqDto
{
    public Guid? ItemId { get; set; } // For individual item transfer
    public Guid? SourceUserId { get; set; } // Made nullable for cases where the item has no manager
    public Guid TargetUserId { get; set; }
    public TransferTypeEnum TransferType { get; set; }
}

public enum TransferTypeEnum
{
    Facilities = 1,
    Theater = 2,
    Movie = 3
}
