using System;
using System.Security.Cryptography;
using System.Text;
using BusinessLayer.Interfaces.IThirdPersonServices;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Shared.Exceptions;

namespace DataAccess.Services;

public class Sha256Service : ISha256Services 
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<Sha256Service> _logger;

    public Sha256Service(IConfiguration configuration, ILogger<Sha256Service> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public string Encrypt(string text, string secretKey)
    {
        try
        {
            var hash = new StringBuilder();
            byte[] secretkeyBytes = Encoding.UTF8.GetBytes(secretKey);
            byte[] inputBytes = Encoding.UTF8.GetBytes(text);
            using (var hmac = new HMACSHA512(secretkeyBytes))
            {
                byte[] hashValue = hmac.ComputeHash(inputBytes);
                foreach (var theByte in hashValue)
                {
                    hash.Append(theByte.ToString("x2"));
                }
            }

            return hash.ToString();
        }
        catch (Exception e)
        {
            _logger.LogError(e.Message);
            throw CustomSystemException.SystemExceptionCaller();
        }
    }
}
