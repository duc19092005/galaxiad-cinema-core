namespace Application.TheaterManager.UseCases;

public record SlotInput(Guid ScheduleId, Guid MovieId, Guid FormatId, DateTime StartedDate);

public record CreateScheduleCommand(Guid AuditoriumId, IReadOnlyList<SlotInput> Slots);

public record UpdateScheduleCommand(Guid AuditoriumId, IReadOnlyList<SlotInput> Slots);
