
using Shared.Exceptions;

public class BaseManagementStatus<T> where T : class
{
    public bool IsDeleted { get; set; } = false;
    public bool IsActive { get; set; } = true;
    
    public DateTime? DeletedAt { get; set; }
    private DateTime _activeAt { get; set; }
    
    public DateTime ActiveAt
    {
        get => _activeAt;
        set
        {
            // Allow -30 seconds to validate
            if (value < DateTime.Now.AddSeconds(-30))
            {
                throw new BadRequestException(
                    "Error Active time is invalid , Active time must be higher than the current time", "T01");
            }
            else
            {
                _activeAt = value;
            }
        }
    }

    public DateTime CreatedAt { get; set; } = DateTime.Now;
    
    public DateTime UpdatedAt { get; set; } = DateTime.Now;
    
    public Guid CreatedByUserId { get; set; } 
    public Guid? UpdatedByUserId { get; set; }
    public Guid? DeletedByUserId { get; set; }

    public virtual T? Creator { get; set; }    
    public virtual T? Updater { get; set; }    
    public virtual T? Deleter { get; set; }    
}
