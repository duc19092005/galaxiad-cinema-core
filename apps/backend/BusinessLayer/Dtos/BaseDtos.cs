namespace BusinessLayer.Dtos;

public class BaseFormatInfo
{
    public string FormatName { get; set; } = String.Empty;
    
    public Guid FormatId { get; set; }
}

public class BaseRequiredAge
{
    public Guid MovieRequiredAgeSymbolId { get; set; } = Guid.Empty;
    
    public string MovieRequiredAgeSymbol { get; set; } = String.Empty;
    
    public string MovieRequiredAgeDescription { get; set; } = String.Empty;
}
