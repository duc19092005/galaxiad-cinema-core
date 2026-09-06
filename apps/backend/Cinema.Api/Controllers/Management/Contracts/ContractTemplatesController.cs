using Cinema.Application.Dtos.MovieManager.Contracts;
using Cinema.Application.UseCases.MovieManager.ContractTemplates;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers.Management.Contracts;

[ApiController]
[Route("api/contract-templates")]
[Authorize(Roles = "Admin,MovieManager")]
[Tags("Contract templates")]
public sealed class ContractTemplatesController : ControllerBase
{
    private readonly ListContractTemplatesUseCase _listUseCase;
    private readonly CreateContractTemplateUseCase _createUseCase;
    private readonly UpdateContractTemplateDraftUseCase _updateUseCase;
    private readonly PublishContractTemplateUseCase _publishUseCase;
    private readonly RetireContractTemplateUseCase _retireUseCase;

    public ContractTemplatesController(
        ListContractTemplatesUseCase listUseCase,
        CreateContractTemplateUseCase createUseCase,
        UpdateContractTemplateDraftUseCase updateUseCase,
        PublishContractTemplateUseCase publishUseCase,
        RetireContractTemplateUseCase retireUseCase)
    {
        _listUseCase = listUseCase;
        _createUseCase = createUseCase;
        _updateUseCase = updateUseCase;
        _publishUseCase = publishUseCase;
        _retireUseCase = retireUseCase;
    }

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var rows = await _listUseCase.ExecuteAsync(ct);
        return Ok(new { isSuccess = true, data = rows });
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateContractTemplateReqDto request, CancellationToken ct)
    {
        var item = await _createUseCase.ExecuteAsync(request, ct);
        return Ok(new { isSuccess = true, data = item });
    }

    [HttpPut("{id:guid}/draft")]
    public async Task<IActionResult> Update(Guid id, UpdateContractTemplateReqDto request, CancellationToken ct)
    {
        var item = await _updateUseCase.ExecuteAsync(id, request, ct);
        return Ok(new { isSuccess = true, data = item });
    }

    [HttpPost("{id:guid}/publish")]
    public async Task<IActionResult> Publish(Guid id, CancellationToken ct)
    {
        var status = await _publishUseCase.ExecuteAsync(id, ct);
        return Ok(new { isSuccess = true, data = new { status } });
    }

    [HttpPost("{id:guid}/retire")]
    public async Task<IActionResult> Retire(Guid id, CancellationToken ct)
    {
        var status = await _retireUseCase.ExecuteAsync(id, ct);
        return Ok(new { isSuccess = true, data = new { status } });
    }
}
