// ReSharper disable All


public class base_management_status<T> where T : class
{
    public bool isDeleted { get; set; } = false;
    public bool isActive { get; set; } = true;
    public DateTime? deletedAt { get; set; }
    public DateTime activeAt { get; set; }
    public DateTime createdAt { get; set; } = DateTime.Now;
    
    public DateTime updatedAt { get; set; } = DateTime.Now;
    
    public Guid createdByUserId { get; set; } 
    public Guid? updatedByUserId { get; set; }
    public Guid? deletedByUserId { get; set; }

    public virtual T? creator { get; set; }    
    public virtual T? updater { get; set; }    
    public virtual T? deleter { get; set; }    
}