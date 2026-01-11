using BussinessLayer.Dtos.Identity_Access;
using BussinessLayer.Dtos.Response;
using BussinessLayer.Factories;
using BussinessLayer.Use_cases.Identity_access;
using DataAccess.Enums;

// ReSharper disable All


namespace BussinessLayer.Services.Identity_access;

public class register_service
{
    private register_factory register_factory ;
    
    public register_service(register_factory register_factory)
    {
        this.register_factory = register_factory;
    }
    public async Task<base_reponse<string>> regularRegister(regular_register_request_dto registerRegularIdentityAccessDto)
    {
        var objects =  
            register_factory.Create<regular_register_request_dto , string>(register_method_enum.UsernamePassword);
        var results = await objects.Add(registerRegularIdentityAccessDto);
        return results;
    }
}