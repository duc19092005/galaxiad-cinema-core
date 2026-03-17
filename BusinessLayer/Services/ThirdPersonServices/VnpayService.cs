using System.Net;
using BusinessLayer.Services.ThirdPersonServices.HashServices;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Shared.Exceptions;
using Shared.Utils;

namespace BusinessLayer.Services.ThirdPersonServices;

public interface IVnPayService
{
    string GenerateVnpayUrl(long amount, string orderId);
}

public class VnpayUrlParams
{
    public string VnpVersion { get; set; } = "2.1.0";

    public string VnpCommand { get; set; } = "pay";

    public string VnpTmnCode { get; set; } = string.Empty;

    public long VnpAmount { get; set; }

    public string VnpCreateDate { get; set; } = DateTime.Now.ToString("yyyyMMddHHmmss");

    public string VnpCurrCode { get; set; } = "VND";

    public string VnpIpAddr { get; set; } = string.Empty;

    public string VnpLocale { get; set; } = "vn";

    public string VnpOrderInfo { get; set; } = string.Empty;

    public string VnpOrderType { get; set; } = "other";

    public string VnpReturnUrl { get; set; } = string.Empty;

    public string VnpTxnRef { get; set; } = string.Empty;

    public VnpayUrlParams
    (string vnpTmnCode, long vnpAmount, string vnpIpAddr,
        string vnpOrderInfo, string vnpReturnUrl, string vnpTxnRef)
    {
        this.VnpTmnCode = vnpTmnCode;
        this.VnpAmount = vnpAmount;
        this.VnpIpAddr = vnpIpAddr;
        this.VnpOrderInfo = vnpOrderInfo;
        this.VnpReturnUrl = vnpReturnUrl;
        this.VnpTxnRef = vnpTxnRef;
    }
}

public class VnpayService : IVnPayService
{
    private readonly IConfiguration _configuration;
    
    private readonly ISha256Services _sha256Services;

    private readonly ILogger<VnpayService> _logger;

    public VnpayService(IConfiguration configuration , ISha256Services sha256Services ,
        ILogger<VnpayService> logger)
    {
        this._configuration = configuration;
        this._sha256Services = sha256Services;
        this._logger = logger;
    }
    public string GenerateVnpayUrl(long amount, string orderId)
    {
        try
        {
            string ipAddress = GetCurrentIpAddressHelper.GetIpAddress();
            //var request = new PaymentRequest()
            //{
            //    PaymentId = DateTime.Now.Ticks,
            //    Money = amount,
            //    Description = $"Đây là đơn thanh toán cho đơn hàng số {orderID}",
            //    BankCode = VNPAY.NET.Enums.BankCode.ANY,
            //    CreatedDate = DateTime.Now,
            //    Currency = VNPAY.NET.Enums.Currency.VND,
            //    Language = VNPAY.NET.Enums.DisplayLanguage.Vietnamese ,
            //    IpAddress = ipAddress ,  
            //};

            //var paymentURL = vnpay.GetPaymentUrl(request);

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

            var vnpayParams = new Dictionary<string, string>
            {
                { "vnp_Version", "2.1.0" },
                { "vnp_Command", "pay" },
                { "vnp_TmnCode", tmnCode },
                { "vnp_Amount", (amount * 100).ToString() },
                { "vnp_CreateDate", DateTime.Now.ToString("yyyyMMddHHmmss") },
                { "vnp_CurrCode", "VND" },
                { "vnp_IpAddr", ipAddress },
                { "vnp_Locale", "vn" },
                { "vnp_OrderInfo", orderInfo },
                { "vnp_OrderType", "other" },
                { "vnp_ReturnUrl", returnUrl },
                { "vnp_TxnRef", orderId }
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

            // Mã hóa (tận dụng hàm Encrypt ở project cũ có lõi là HMACSHA512 mặc dù tên file là SHA256)
            var convertToSha512 = _sha256Services.Encrypt(rawDataStr, secureHash);

            string finalUrl = $"{vnpaySandboxUrl}?{queryStringStr}&vnp_SecureHash={convertToSha512}";

            return finalUrl;


        }
        catch (Exception ex)
        {
            _logger.LogError(ex , "Error While Create Vnpay Url");
            throw CustomSystemException.SystemExceptionCaller();
        }
    }
}