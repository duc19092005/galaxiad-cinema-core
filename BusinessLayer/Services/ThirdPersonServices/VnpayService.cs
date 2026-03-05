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

            if (_configuration["Vnpay:Tmd_Code"] == null || _configuration["Vnpay:vnp_ReturnUrl"] == null ||
                _configuration["Vnpay:SecureHash"] == null)
            {
                _logger.LogError("Vnpay Secrect Key is null");
                throw CustomSystemException.SystemExceptionCaller();
            }

            var newUrlParams = new VnpayUrlParams
            (_configuration["Vnpay:Tmd_Code"], amount, ipAddress
                , $"Đây là đơn thanh toán cho đơn hàng số {orderId}", _configuration["Vnpay:vnp_ReturnUrl"], orderId);

            var vnpaySandboxUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

            // Các Params 

            Dictionary<string, string> vnpayParams = new Dictionary<string, string>()
            {
                { "vnp_Version", newUrlParams.VnpVersion },
                { "vnp_Command", newUrlParams.VnpCommand },
                { "vnp_TmnCode", newUrlParams.VnpTmnCode },
                { "vnp_Amount", (newUrlParams.VnpAmount * 100).ToString() },
                { "vnp_CreateDate", newUrlParams.VnpCreateDate },
                { "vnp_CurrCode", newUrlParams.VnpCurrCode },
                { "vnp_IpAddr", newUrlParams.VnpIpAddr },
                { "vnp_Locale", newUrlParams.VnpLocale },
                { "vnp_OrderInfo", WebUtility.UrlEncode(newUrlParams.VnpOrderInfo) },
                { "vnp_OrderType", newUrlParams.VnpOrderType },
                { "vnp_ReturnUrl", WebUtility.UrlEncode(newUrlParams.VnpReturnUrl) },
                { "vnp_TxnRef", orderId }
            };

            var orderByParams = vnpayParams.OrderBy(x => x.Key);

            // Convert sang dạng Params của Vnpay Yêu cầu

            var convertToParamsToVnpayRequireParams = orderByParams
                .Select(x => x.Key + "=" + x.Value);

            // ToURL

            var convertParamsToUrl = String.Join("&", convertToParamsToVnpayRequireParams);

            // Mã hóa

            var convertToSha512 =
                _sha256Services.Encrypt(convertParamsToUrl, _configuration["Vnpay:SecureHash"]);

            // Chuyển sang dạng URL của VNPAY để tạo yêu cầu request

            var convertToUrl =
                vnpaySandboxUrl +
                "?" +
                convertParamsToUrl
                +
                "&" +
                "vnp_SecureHash" +
                "=" +
                convertToSha512;

            return convertToUrl;


        }
        catch (Exception ex)
        {
            _logger.LogError(ex , "Error While Create Vnpay Url");
            throw CustomSystemException.SystemExceptionCaller();
        }
    }
}