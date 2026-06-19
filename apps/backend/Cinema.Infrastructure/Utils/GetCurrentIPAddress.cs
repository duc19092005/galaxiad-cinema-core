using System.Net;

namespace Cinema.Domain.Utils;

public static class GetCurrentIpAddressHelper
{
    public static string GetIpAddress()
    {
        string hostName = Dns.GetHostName();
        string Ip = Dns.GetHostByName(hostName).AddressList[0].ToString();
        return Ip;
    }

}