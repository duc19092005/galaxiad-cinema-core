using Cinema.Application.Interfaces;
using Cinema.Domain.Entities.Contracts;
using Cinema.Domain.Enums;
using Cinema.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Api.Controllers.Management.Contracts;

[ApiController]
[Route("api/contract-templates")]
[Authorize(Roles = "Admin,MovieManager")]
[Tags("Contract templates")]
public sealed class ContractTemplatesController : ControllerBase
{
    private readonly CinemaDbContext _db;
    private readonly IUserContextService _user;
    public ContractTemplatesController(CinemaDbContext db, IUserContextService user) { _db = db; _user = user; }

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var query = _db.ContractTemplateEntity.AsNoTracking();
        if (!_user.IsInRole("Admin")) query = query.Where(x => x.Status == ContractTemplateStatus.Published);
        var rows = await query.OrderBy(x => x.Code).ThenByDescending(x => x.Version).Select(x => new
        {
            x.ContractTemplateId, x.Code, x.Name, x.Version, status = x.Status.ToString(),
            x.SchemaJson, x.BodyTemplate, x.CreatedAt, x.PublishedAt
        }).ToListAsync(ct);
        return Ok(new { isSuccess = true, data = rows });
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateTemplateRequest request, CancellationToken ct)
    {
        if (!_user.IsInRole("Admin")) return Forbid();
        var nextVersion = (await _db.ContractTemplateEntity.Where(x => x.Code == request.Code).MaxAsync(x => (int?)x.Version, ct) ?? 0) + 1;
        var item = new ContractTemplateEntity
        {
            ContractTemplateId = Guid.NewGuid(), Code = request.Code.Trim().ToUpperInvariant(), Name = request.Name.Trim(),
            Version = nextVersion, SchemaJson = request.SchemaJson, BodyTemplate = request.BodyTemplate,
            CreatedByUserId = _user.GetUserId(), Status = ContractTemplateStatus.Draft
        };
        _db.ContractTemplateEntity.Add(item); await _db.SaveChangesAsync(ct);
        return Ok(new { isSuccess = true, data = item });
    }

    [HttpPut("{id:guid}/draft")]
    public async Task<IActionResult> Update(Guid id, UpdateTemplateRequest request, CancellationToken ct)
    {
        if (!_user.IsInRole("Admin")) return Forbid();
        var item = await _db.ContractTemplateEntity.FindAsync([id], ct);
        if (item == null) return NotFound();
        if (item.Status != ContractTemplateStatus.Draft) return Conflict(new { isSuccess = false, errorCode = "PUBLISHED_TEMPLATE_IMMUTABLE", message = "Mẫu đã phát hành không được sửa tại chỗ." });
        item.Name = request.Name.Trim(); item.SchemaJson = request.SchemaJson; item.BodyTemplate = request.BodyTemplate;
        await _db.SaveChangesAsync(ct); return Ok(new { isSuccess = true, data = item });
    }

    [HttpPost("{id:guid}/publish")]
    public async Task<IActionResult> Publish(Guid id, CancellationToken ct)
    {
        if (!_user.IsInRole("Admin")) return Forbid();
        var item = await _db.ContractTemplateEntity.FindAsync([id], ct);
        if (item == null) return NotFound();
        if (item.Status != ContractTemplateStatus.Draft) return Conflict();
        item.Status = ContractTemplateStatus.Published; item.PublishedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct); return Ok(new { isSuccess = true, data = new { status = "Published" } });
    }

    [HttpPost("{id:guid}/retire")]
    public async Task<IActionResult> Retire(Guid id, CancellationToken ct)
    {
        if (!_user.IsInRole("Admin")) return Forbid();
        var item = await _db.ContractTemplateEntity.FindAsync([id], ct);
        if (item == null) return NotFound();
        item.Status = ContractTemplateStatus.Retired; await _db.SaveChangesAsync(ct);
        return Ok(new { isSuccess = true, data = new { status = "Retired" } });
    }
}

public sealed record CreateTemplateRequest(string Code, string Name, string SchemaJson, string BodyTemplate);
public sealed record UpdateTemplateRequest(string Name, string SchemaJson, string BodyTemplate);
