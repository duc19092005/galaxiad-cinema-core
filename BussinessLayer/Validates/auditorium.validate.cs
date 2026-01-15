using DataAccess;

namespace BussinessLayer.Validates;

public class auditorium_validate
{
    public static bool isDuplicateAuditoriumNumber(dbContext dbContext , Guid? auditoriumId ,string auditoriumNumber , Guid cinemaId)
    {
        if (auditoriumId == null)
        {
            // Check Trong DB
            var checkDuplicateAuditoriumNumber =
                dbContext.auditorium_info_entity.FirstOrDefault
                (x => x.auditoriumNumber.Equals(auditoriumNumber)
                      && x.cinemaId.Equals(cinemaId)
                      && !x.isDeleted);
            return checkDuplicateAuditoriumNumber != null ? true : false;
        }
        else
        {
            var checkDuplicateAuditoriumNumber =
                dbContext.auditorium_info_entity.FirstOrDefault
                (x => x.auditoriumNumber.Equals(auditoriumNumber)
                      && x.cinemaId.Equals(cinemaId)
                      && !x.isDeleted
                      && !x.auditoriumId.Equals(auditoriumId));
            return checkDuplicateAuditoriumNumber != null ? true : false;
        }
    }
}