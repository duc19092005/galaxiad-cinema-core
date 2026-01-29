using DataAccess;

namespace BusinessLayer.Validators;

public static class AuditoriumValidate
{
    public static bool IsDuplicateAuditoriumNumber(CinemaDbContext dbContext , Guid? AuditoriumId ,string AuditoriumNumber , Guid? CinemaId)
    {
        if (AuditoriumId == null)
        {
            // Check Trong DB
            var checkDuplicateAuditoriumNumber =
                dbContext.AuditoriumInfoEntities.FirstOrDefault
                (x => x.AuditoriumNumber.Equals(AuditoriumNumber)
                      && x.CinemaId.Equals(CinemaId)
                      && !x.IsDeleted);
            return checkDuplicateAuditoriumNumber != null ? true : false;
        }
        else
        {
            var checkDuplicateAuditoriumNumber =
                dbContext.AuditoriumInfoEntities.FirstOrDefault
                (x => x.AuditoriumNumber.Equals(AuditoriumNumber)
                      && x.CinemaId.Equals(CinemaId)
                      && !x.IsDeleted
                      && !x.AuditoriumId.Equals(AuditoriumId));
            return checkDuplicateAuditoriumNumber != null ? true : false;
        }
    }
}

