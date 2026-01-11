using BussinessLayer.Dtos.Identity_Access;
using BussinessLayer.Dtos;
using BussinessLayer.Factories.Identity_access;
using BussinessLayer.Use_cases.Identity_access;
using DataAccess.Enums;
using Microsoft.AspNetCore.Http;

// ReSharper disable All


namespace BussinessLayer.Services.Identity_access;

public class login_service
{
    private login_factory login_factory;
    
    public login_service(login_factory login_factory)
    {
        this.login_factory = login_factory;
    }
    
    public async Task<base_reponse<regular_login_res_dto>> regularLogin(regular_login_req_dto regular_login_req_dto)
    {
        var objects = login_factory.Login<regular_login_req_dto, regular_login_res_dto>(register_method_enum.UsernamePassword);
        var results = await objects.Login(regular_login_req_dto);
        
        return results;
    }
}