// ReSharper disable All


using Backend.Shard.Exceptions;

public class base_management_status<T> where T : class
{
    public bool isDeleted { get; set; } = false;
    public bool isActive { get; set; } = true;
    
    public DateTime? deletedAt { get; set; }
    private DateTime activeAt { get; set; }
    
    public DateTime ActiveAt
    {
        get => activeAt;
        set
        {
            // Allow -30 seconds to validate
            if (value < DateTime.Now.AddSeconds(-30))
            {
                throw new badRequestException(
                    "Error Active time is invalid , Active time must be higher than the current time", "T01");
            }
            else
            {
                activeAt = value;
            }
        }
    }

    public DateTime createdAt { get; set; } = DateTime.Now;
    
    public DateTime updatedAt { get; set; } = DateTime.Now;
    
    public Guid createdByUserId { get; set; } 
    public Guid? updatedByUserId { get; set; }
    public Guid? deletedByUserId { get; set; }

    public virtual T? creator { get; set; }    
    public virtual T? updater { get; set; }    
    public virtual T? deleter { get; set; }    
}