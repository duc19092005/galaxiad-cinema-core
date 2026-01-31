namespace BusinessLayer.Validators;

static class GeneralValidation
{
    public static bool ValidateDates(DateTime startedDate , DateTime endedDate)
    {
        return startedDate < endedDate 
        && endedDate > DateTime.Now
        && startedDate > DateTime.Now.AddSeconds(-20);
    }
}