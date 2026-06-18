using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using BusinessLayer.Interfaces.IThirdPersonServices;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Shared.Exceptions;

namespace DataAccess.Services;

public class VnpayService : IVnPayService
{
    private readonly IConfiguration _configuration;
    private readonly ISha256Services _sha256Services;
    private readonly ILogger<VnpayService> _logger;

    public VnpayService(IConfiguration configuration, ISha256Services sha256Services, ILogger<VnpayService> logger)
    {
        _configuration = configuration;
        _sha256Services = sha256Services;
        _logger = logger;
    }

    public string GenerateVnpayUrl(long amount, string orderId, string ipAddress)
    {
        try
        {
            string tmnCode = _configuration["VNPay:TmnCode"];
            string secureHash = _configuration["VNPay:HashSecret"];
            string returnUrl = _configuration["VNPay:ReturnUrl"];

            if (string.IsNullOrEmpty(tmnCode) || string.IsNullOrEmpty(returnUrl) || string.IsNullOrEmpty(secureHash))
            {
                _logger.LogError("Vnpay Secrect Key is null");
                throw CustomSystemException.SystemExceptionCaller();
            }

            string vnpaySandboxUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
            string orderInfo = $"Thanh toan don hang {orderId}";

            // VNPAY requires time in GMT+7 (Vietnam Time)
            DateTime vietnamTime = DateTime.UtcNow.AddHours(7);

            var vnpayParams = new Dictionary<string, string>
            {
                { "vnp_Version", "2.1.0" },
                { "vnp_Command", "pay" },
                { "vnp_TmnCode", tmnCode },
                { "vnp_Amount", (amount * 100).ToString() },
                { "vnp_CreateDate", vietnamTime.ToString("yyyyMMddHHmmss") },
                { "vnp_CurrCode", "VND" },
                { "vnp_IpAddr", ipAddress },
                { "vnp_Locale", "vn" },
                { "vnp_OrderInfo", orderInfo },
                { "vnp_OrderType", "other" },
                { "vnp_ReturnUrl", returnUrl },
                { "vnp_TxnRef", orderId },
                { "vnp_ExpireDate", vietnamTime.AddMinutes(15).ToString("yyyyMMddHHmmss") }
            };

            var sortedParams = vnpayParams.OrderBy(x => x.Key).ToList();

            System.Text.StringBuilder rawData = new System.Text.StringBuilder();
            System.Text.StringBuilder queryString = new System.Text.StringBuilder();

            foreach (var vp in sortedParams)
            {
                if (!string.IsNullOrEmpty(vp.Value))
                {
                    string encodedKey = WebUtility.UrlEncode(vp.Key);
                    string encodedValue = WebUtility.UrlEncode(vp.Value);

                    queryString.Append(encodedKey + "=" + encodedValue + "&");
                    rawData.Append(encodedKey + "=" + encodedValue + "&");
                }
            }

            string rawDataStr = rawData.ToString().TrimEnd('&');
            string queryStringStr = queryString.ToString().TrimEnd('&');

            // Hashing using the interface dependency
            var convertToSha512 = _sha256Services.Encrypt(rawDataStr, secureHash);

            string finalUrl = $"{vnpaySandboxUrl}?{queryStringStr}&vnp_SecureHash={convertToSha512}";

            return finalUrl;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error While Create Vnpay Url");
            throw CustomSystemException.SystemExceptionCaller();
        }
    }
}
