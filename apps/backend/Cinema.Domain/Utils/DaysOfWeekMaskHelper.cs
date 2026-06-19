using Cinema.Domain.Enums;

namespace Cinema.Domain.Utils;

public static class DaysOfWeekMaskHelper
{
    private static readonly IReadOnlyDictionary<string, DaysOfWeekMaskEnum> DayByName =
        new Dictionary<string, DaysOfWeekMaskEnum>(StringComparer.OrdinalIgnoreCase)
        {
            ["Monday"] = DaysOfWeekMaskEnum.Monday,
            ["Tuesday"] = DaysOfWeekMaskEnum.Tuesday,
            ["Wednesday"] = DaysOfWeekMaskEnum.Wednesday,
            ["Thursday"] = DaysOfWeekMaskEnum.Thursday,
            ["Friday"] = DaysOfWeekMaskEnum.Friday,
            ["Saturday"] = DaysOfWeekMaskEnum.Saturday,
            ["Sunday"] = DaysOfWeekMaskEnum.Sunday
        };

    public static int Encode(IEnumerable<string>? days)
    {
        if (days == null)
        {
            return (int)DaysOfWeekMaskEnum.All;
        }

        var mask = DaysOfWeekMaskEnum.None;
        foreach (var day in days)
        {
            if (DayByName.TryGetValue(day, out var value))
            {
                mask |= value;
            }
        }

        return mask == DaysOfWeekMaskEnum.None ? (int)DaysOfWeekMaskEnum.All : (int)mask;
    }

    public static List<string> Decode(int mask)
    {
        var days = new List<string>();
        AddIf(mask, DaysOfWeekMaskEnum.Monday, "Monday", days);
        AddIf(mask, DaysOfWeekMaskEnum.Tuesday, "Tuesday", days);
        AddIf(mask, DaysOfWeekMaskEnum.Wednesday, "Wednesday", days);
        AddIf(mask, DaysOfWeekMaskEnum.Thursday, "Thursday", days);
        AddIf(mask, DaysOfWeekMaskEnum.Friday, "Friday", days);
        AddIf(mask, DaysOfWeekMaskEnum.Saturday, "Saturday", days);
        AddIf(mask, DaysOfWeekMaskEnum.Sunday, "Sunday", days);
        return days;
    }

    public static string DecodeText(int mask)
    {
        var labels = new List<string>();
        AddIf(mask, DaysOfWeekMaskEnum.Monday, "Mon", labels);
        AddIf(mask, DaysOfWeekMaskEnum.Tuesday, "Tue", labels);
        AddIf(mask, DaysOfWeekMaskEnum.Wednesday, "Wed", labels);
        AddIf(mask, DaysOfWeekMaskEnum.Thursday, "Thu", labels);
        AddIf(mask, DaysOfWeekMaskEnum.Friday, "Fri", labels);
        AddIf(mask, DaysOfWeekMaskEnum.Saturday, "Sat", labels);
        AddIf(mask, DaysOfWeekMaskEnum.Sunday, "Sun", labels);
        return labels.Count == 7 ? "Every day" : string.Join(", ", labels);
    }

    public static int ToMask(DayOfWeek day)
    {
        return day switch
        {
            DayOfWeek.Monday => (int)DaysOfWeekMaskEnum.Monday,
            DayOfWeek.Tuesday => (int)DaysOfWeekMaskEnum.Tuesday,
            DayOfWeek.Wednesday => (int)DaysOfWeekMaskEnum.Wednesday,
            DayOfWeek.Thursday => (int)DaysOfWeekMaskEnum.Thursday,
            DayOfWeek.Friday => (int)DaysOfWeekMaskEnum.Friday,
            DayOfWeek.Saturday => (int)DaysOfWeekMaskEnum.Saturday,
            DayOfWeek.Sunday => (int)DaysOfWeekMaskEnum.Sunday,
            _ => (int)DaysOfWeekMaskEnum.None
        };
    }

    private static void AddIf(int mask, DaysOfWeekMaskEnum value, string label, List<string> target)
    {
        if ((mask & (int)value) != 0)
        {
            target.Add(label);
        }
    }
}
