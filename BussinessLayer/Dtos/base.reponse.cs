namespace BussinessLayer.Dtos;
// ReSharper disable All

public class baseResponse<T>
{
    public bool isSuccess { get; set; }
    public string message { get; set; } = string.Empty;
    public T? data { get; set; }
}