using System.Security.Cryptography;
using System.Text;

namespace Cinema.Testing.Fixtures;

public static class VnPayTestHelper
{
    public const string TestHashSecret = "TESTHASHSECRET1234567890ABCDEF";

    public static string CreateSecureHash(IDictionary<string, string> parameters, string? secret = null)
    {
        secret ??= TestHashSecret;

        // Sort keys
        var sortedParams = parameters
            .Where(kv => !string.IsNullOrEmpty(kv.Key) && !string.IsNullOrEmpty(kv.Value) && kv.Key != "vnp_SecureHash")
            .OrderBy(kv => kv.Key, StringComparer.Ordinal);

        var data = new StringBuilder();
        foreach (var kv in sortedParams)
        {
            if (data.Length > 0)
            {
                data.Append('&');
            }
            data.Append(Uri.EscapeDataString(kv.Key));
            data.Append('=');
            data.Append(Uri.EscapeDataString(kv.Value));
        }

        return HmacSha512(secret, data.ToString());
    }

    public static string HmacSha512(string key, string inputData)
    {
        var keyBytes = Encoding.UTF8.GetBytes(key);
        var inputBytes = Encoding.UTF8.GetBytes(inputData);

        using var hmac = new HMACSHA512(keyBytes);
        var hashValue = hmac.ComputeHash(inputBytes);

        var hex = new StringBuilder();
        foreach (var x in hashValue)
        {
            hex.Append($"{x:x2}");
        }
        return hex.ToString();
    }
}
