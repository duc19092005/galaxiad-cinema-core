// ReSharper disable All

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiLayer.Controllers.Public;

[ApiController]
[Route("api/facilities/auditorium")]
[Tags("FacilitiesManager - auditorium")]
[ApiExplorerSettings(GroupName = "v1-facilities-manager")]
public class PublicController : ControllerBase
{
    
}
