using BusinessLayer.Entities.CinemaInfos;

namespace BusinessLayer.Validators;

public static class AuditoriumValidate
{
    public static bool IsDuplicateAuditoriumNumber(
        IQueryable<AuditoriumInfoEntities> auditoriums,
        Guid? auditoriumId,
        string auditoriumNumber,
        Guid? cinemaId)
    {
        if (auditoriumId == null)
        {
            // Check Trong DB
            var checkDuplicateAuditoriumNumber =
                auditoriums.FirstOrDefault
                (x => x.AuditoriumNumber.Equals(auditoriumNumber)
                      && x.CinemaId.Equals(cinemaId)
                      && !x.IsDeleted);
            return checkDuplicateAuditoriumNumber != null ? true : false;
        }
        else
        {
            var checkDuplicateAuditoriumNumber =
                auditoriums.FirstOrDefault
                (x => x.AuditoriumNumber.Equals(auditoriumNumber)
                      && x.CinemaId.Equals(cinemaId)
                      && !x.IsDeleted
                      && !x.AuditoriumId.Equals(auditoriumId));
            return checkDuplicateAuditoriumNumber != null ? true : false;
        }
    }
}

