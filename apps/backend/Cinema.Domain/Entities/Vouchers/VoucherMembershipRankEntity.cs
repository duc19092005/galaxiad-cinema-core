using System;
using Cinema.Domain.Enums;

namespace Cinema.Domain.Entities.Vouchers;

public class VoucherMembershipRankEntity
{
    public Guid VoucherId { get; set; }
    public VoucherInfoEntity VoucherInfoEntity { get; set; } = null!;

    public MembershipRankEnum MembershipRank { get; set; }
}
