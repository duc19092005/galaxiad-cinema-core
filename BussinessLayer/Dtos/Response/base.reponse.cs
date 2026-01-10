namespace BussinessLayer.Dtos.Response;
// ReSharper disable All

public class base_reponse<T>
{
    public bool isSuccess { get; set; }
    public string message { get; set; } = string.Empty;
    public T? data { get; set; }
}