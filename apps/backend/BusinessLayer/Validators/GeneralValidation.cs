namespace BusinessLayer.Validators;

static class GeneralValidation
{
    public static (bool IsValid, string Message) ValidateDates(
        DateTime? reqStart,
        DateTime? reqEnd,
        DateTime? oldStart = null,
        DateTime? oldEnd = null)
    {
        var now = DateTime.UtcNow;

        var finalStart = reqStart ?? oldStart ?? DateTime.MinValue;
        var finalEnd = reqEnd ?? oldEnd ?? DateTime.MaxValue;

        if (finalStart >= finalEnd)
        {
            return (false, "Started Date must be lower than the ended date.");
        }

        if (reqStart.HasValue || oldStart == null)
        {
            var startToVerify = (reqStart ?? finalStart).ToUniversalTime();
            if (startToVerify < now.AddSeconds(-20))
            {
                return (false, "Started Date must be higher than the current date.");
            }
        }

        if (reqEnd.HasValue || oldEnd == null)
        {
            var endToVerify = reqEnd ?? finalEnd;
            if (endToVerify < now)
            {
                return (false, "Ended Date must be higher than the current date.");
            }
        }

        return (true, string.Empty);
    }

    public static bool IsGuidHasValue(Guid? id)
    {
        if (!id.HasValue)
        {
            return false;
        }
        return true;
    }
}