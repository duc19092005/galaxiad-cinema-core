using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
// ReSharper disable All

namespace Cinema.Domain.Entities.Concessions;

/// <summary>
/// Thành phần của một combo. Khi bán combo, hệ thống trừ kho theo từng sản phẩm con
/// thay vì trừ kho của chính combo đó.
/// </summary>
public class ConcessionComboItemEntity
{
    [Key]
    public Guid ComboItemId { get; set; }

    /// <summary>Sản phẩm combo (có IsCombo = true)</summary>
    public Guid ComboProductId { get; set; }

    /// <summary>Sản phẩm thành phần nằm trong combo</summary>
    public Guid ComponentProductId { get; set; }

    /// <summary>Số lượng thành phần trong một combo. Ví dụ: 2 nước</summary>
    public int Quantity { get; set; } = 1;

    public ConcessionProductEntity ComboProduct { get; set; } = null!;

    public ConcessionProductEntity ComponentProduct { get; set; } = null!;
}
