using System.Globalization;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;

namespace Shared.Utils;

public class VnPayHelper
{
    private readonly string _tmnCode;
    private readonly string _hashSecret;
    private readonly string _payUrl;
    private readonly string _returnUrl;

    public VnPayHelper(IConfiguration configuration)
    {
        var vnPaySection = configuration.GetSection("VNPay");
        _tmnCode = vnPaySection["TmnCode"] ?? throw new Exception("VNPay TmnCode is not configured");
        _hashSecret = vnPaySection["HashSecret"] ?? throw new Exception("VNPay HashSecret is not configured");
        _payUrl = vnPaySection["PayUrl"] ?? "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
        _returnUrl = vnPaySection["ReturnUrl"] ?? "http://localhost:5032/api/v1/booking/vnpay-callback";
    }

    /// <summary>
    /// Tạo URL thanh toán VNPay
    /// </summary>
    public string CreatePaymentUrl(Guid orderId, decimal amount, string orderInfo, string ipAddress)
    {
        var vnpParams = new SortedDictionary<string, string>
        {
            { "vnp_Version", "2.1.0" },
            { "vnp_Command", "pay" },
            { "vnp_TmnCode", _tmnCode },
            { "vnp_Amount", ((long)(amount * 100)).ToString() },
            { "vnp_CreateDate", DateTime.Now.ToString("yyyyMMddHHmmss") },
            { "vnp_CurrCode", "VND" },
            { "vnp_IpAddr", ipAddress },
            { "vnp_Locale", "vn" },
            { "vnp_OrderInfo", orderInfo },
            { "vnp_OrderType", "billpayment" },
            { "vnp_ReturnUrl", _returnUrl },
            { "vnp_TxnRef", orderId.ToString() },
            { "vnp_ExpireDate", DateTime.Now.AddMinutes(15).ToString("yyyyMMddHHmmss") }
        };

        var queryString = BuildQueryString(vnpParams);
        var signData = BuildSignData(vnpParams);
        var vnpSecureHash = HmacSha512(_hashSecret, signData);
        
        return $"{_payUrl}?{queryString}&vnp_SecureHash={vnpSecureHash}";
    }

    /// <summary>
    /// Validate callback signature từ VNPay
    /// </summary>
    public bool ValidateCallback(IDictionary<string, string> vnpParams)
    {
        if (!vnpParams.ContainsKey("vnp_SecureHash"))
            return false;

        var secureHash = vnpParams["vnp_SecureHash"];
        
        var sortedParams = new SortedDictionary<string, string>();
        foreach (var kvp in vnpParams)
        {
            if (kvp.Key != "vnp_SecureHash" && kvp.Key != "vnp_SecureHashType"
                && !string.IsNullOrEmpty(kvp.Value))
            {
                sortedParams.Add(kvp.Key, kvp.Value);
            }
        }

        var signData = BuildSignData(sortedParams);
        var checkSum = HmacSha512(_hashSecret, signData);

        return checkSum.Equals(secureHash, StringComparison.InvariantCultureIgnoreCase);
    }

    /// <summary>
    /// Lấy trạng thái thanh toán từ response code
    /// </summary>
    public bool IsPaymentSuccess(string responseCode)
    {
        return responseCode == "00";
    }

    private static string BuildQueryString(SortedDictionary<string, string> parameters)
    {
        var sb = new StringBuilder();
        foreach (var kvp in parameters)
        {
            if (sb.Length > 0) sb.Append('&');
            sb.Append(WebUtility.UrlEncode(kvp.Key));
            sb.Append('=');
            sb.Append(WebUtility.UrlEncode(kvp.Value));
        }
        return sb.ToString();
    }

    private static string BuildSignData(SortedDictionary<string, string> parameters)
    {
        var sb = new StringBuilder();
        foreach (var kvp in parameters)
        {
            if (sb.Length > 0) sb.Append('&');
            sb.Append(kvp.Key);
            sb.Append('=');
            sb.Append(kvp.Value);
        }
        return sb.ToString();
    }

    private static string HmacSha512(string key, string inputData)
    {
        var keyBytes = Encoding.UTF8.GetBytes(key);
        var inputBytes = Encoding.UTF8.GetBytes(inputData);
        using var hmac = new HMACSHA512(keyBytes);
        var hashBytes = hmac.ComputeHash(inputBytes);
        return BitConverter.ToString(hashBytes).Replace("-", "").ToUpper();
    }
}
