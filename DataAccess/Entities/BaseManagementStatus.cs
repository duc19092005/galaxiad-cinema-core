
using Shared.Exceptions;

namespace DataAccess.Entities;


public class BaseManagementStatus<T> where T : class
{
    public bool IsDeleted { get; set; } = false;
    public bool IsActive { get; set; } = true;

    public DateTime? DeletedAt { get; set; }
    
    public DateTime ActiveAt {get;set;}

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    public Guid CreatedByUserId { get; set; }
    public Guid? UpdatedByUserId { get; set; }
    public Guid? DeletedByUserId { get; set; }

    public virtual T? Creator { get; set; }
    public virtual T? Updater { get; set; }
    public virtual T? Deleter { get; set; }
}
