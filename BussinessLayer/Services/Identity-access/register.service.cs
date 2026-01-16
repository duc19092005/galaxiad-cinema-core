using BussinessLayer.Dtos.Identity_Access;
using BussinessLayer.Dtos;
using BussinessLayer.Factories.Identity_access;
using BussinessLayer.Use_cases.Identity_access;
using DataAccess.Enums;

// ReSharper disable All


namespace BussinessLayer.Services.Identity_access;

public class registerService
{
    private registerFactory register_factory ;
    
    public registerService(registerFactory register_factory)
    {
        this.register_factory = register_factory;
    }
    public async Task<baseResponse<string>> regularRegister(resRegularRegisterDto registerRegularIdentityAccessDto)
    {
        var objects =  
            register_factory.Create<resRegularRegisterDto , string>(register_method_enum.UsernamePassword);
        var results = await objects.Add(registerRegularIdentityAccessDto);
        return results;
    }
}