using Cinema.Application.Dtos.Common;
using Cinema.Application.Dtos.MovieManager.Contracts;
using Cinema.Application.UseCases.MovieManager.Contracts;
using Cinema.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers.Management.Contracts;

[ApiController]
[Route("api/contracts")]
[Authorize(Roles = "Admin,MovieManager")]
[Tags("Film contracts")]
public sealed class ContractsController : ControllerBase
{
    [HttpGet("reviewers")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Reviewers([FromServices] AssignContractUseCase useCase, CancellationToken ct) =>
        Ok(new { isSuccess = true, data = await useCase.ListAsync(ct) });

    [HttpPost("{id:guid}/assign")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Assign(Guid id, AssignContractReqDto request, [FromServices] AssignContractUseCase useCase, CancellationToken ct)
    {
        await useCase.ExecuteAsync(id, request.MovieManagerId, ct);
        return Ok(new { isSuccess = true });
    }
    private readonly ListContractsUseCase _listContractsUseCase;
    private readonly GetContractDetailUseCase _getContractDetailUseCase;
    private readonly CreateContractUseCase _createContractUseCase;
    private readonly UploadContractDocumentUseCase _uploadContractDocumentUseCase;
    private readonly DownloadContractDocumentUseCase _downloadContractDocumentUseCase;
    private readonly TriggerContractExtractionUseCase _triggerContractExtractionUseCase;
    private readonly ReviewContractExtractionUseCase _reviewContractExtractionUseCase;
    private readonly SubmitContractForReviewUseCase _submitContractForReviewUseCase;
    private readonly ReturnContractUseCase _returnContractUseCase;
    private readonly ApproveContractUseCase _approveContractUseCase;
    private readonly SignContractUseCase _signContractUseCase;
    private readonly ActivateContractUseCase _activateContractUseCase;
    private readonly SuspendContractUseCase _suspendContractUseCase;
    private readonly ResumeContractUseCase _resumeContractUseCase;
    private readonly TerminateContractUseCase _terminateContractUseCase;
    private readonly GetMovieRevenueReconciliationUseCase _getMovieRevenueReconciliationUseCase;

    public ContractsController(
        ListContractsUseCase listContractsUseCase,
        GetContractDetailUseCase getContractDetailUseCase,
        CreateContractUseCase createContractUseCase,
        UploadContractDocumentUseCase uploadContractDocumentUseCase,
        DownloadContractDocumentUseCase downloadContractDocumentUseCase,
        TriggerContractExtractionUseCase triggerContractExtractionUseCase,
        ReviewContractExtractionUseCase reviewContractExtractionUseCase,
        SubmitContractForReviewUseCase submitContractForReviewUseCase,
        ReturnContractUseCase returnContractUseCase,
        ApproveContractUseCase approveContractUseCase,
        SignContractUseCase signContractUseCase,
        ActivateContractUseCase activateContractUseCase,
        SuspendContractUseCase suspendContractUseCase,
        ResumeContractUseCase resumeContractUseCase,
        TerminateContractUseCase terminateContractUseCase,
        GetMovieRevenueReconciliationUseCase getMovieRevenueReconciliationUseCase)
    {
        _listContractsUseCase = listContractsUseCase;
        _getContractDetailUseCase = getContractDetailUseCase;
        _createContractUseCase = createContractUseCase;
        _uploadContractDocumentUseCase = uploadContractDocumentUseCase;
        _downloadContractDocumentUseCase = downloadContractDocumentUseCase;
        _triggerContractExtractionUseCase = triggerContractExtractionUseCase;
        _reviewContractExtractionUseCase = reviewContractExtractionUseCase;
        _submitContractForReviewUseCase = submitContractForReviewUseCase;
        _returnContractUseCase = returnContractUseCase;
        _approveContractUseCase = approveContractUseCase;
        _signContractUseCase = signContractUseCase;
        _activateContractUseCase = activateContractUseCase;
        _suspendContractUseCase = suspendContractUseCase;
        _resumeContractUseCase = resumeContractUseCase;
        _terminateContractUseCase = terminateContractUseCase;
        _getMovieRevenueReconciliationUseCase = getMovieRevenueReconciliationUseCase;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] ContractStatus? status, CancellationToken ct)
    {
        var rows = await _listContractsUseCase.ExecuteAsync(status, ct);
        return Ok(new { isSuccess = true, data = rows });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var item = await _getContractDetailUseCase.ExecuteAsync(id, ct);
        return Ok(new { isSuccess = true, data = item });
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateContractReqDto request, CancellationToken ct)
    {
        var (contractId, internalCode) = await _createContractUseCase.ExecuteAsync(request, ct);
        return CreatedAtAction(nameof(Get), new { id = contractId },
            new { isSuccess = true, data = new { id = contractId, internalCode } });
    }

    [HttpPost("{id:guid}/documents")]
    [RequestSizeLimit(25 * 1024 * 1024)]
    public async Task<IActionResult> Upload(
        Guid id,
        [FromForm] IFormFile file,
        [FromForm] ContractDocumentKind kind = ContractDocumentKind.Original,
        CancellationToken ct = default)
    {
        await using var stream = file.OpenReadStream();
        var fileUpload = new FileUploadModel
        {
            FileName = file.FileName,
            ContentType = file.ContentType,
            Length = file.Length,
            Stream = stream
        };

        var result = await _uploadContractDocumentUseCase.ExecuteAsync(id, fileUpload, kind, ct);
        return Ok(new { isSuccess = true, data = result });
    }

    [HttpGet("{id:guid}/documents/{documentId:guid}")]
    public async Task<IActionResult> Download(Guid id, Guid documentId, CancellationToken ct)
    {
        var (stream, contentType, fileName) = await _downloadContractDocumentUseCase.ExecuteAsync(id, documentId, ct);
        return File(stream, contentType, fileName, true);
    }

    [HttpPost("{id:guid}/extractions")]
    public async Task<IActionResult> Extract(Guid id, CancellationToken ct)
    {
        var jobId = await _triggerContractExtractionUseCase.ExecuteAsync(id, ct);
        return Accepted(new { isSuccess = true, data = new { jobId, processingStatus = "Queued" } });
    }

    [HttpPut("{id:guid}/extraction-review")]
    public async Task<IActionResult> Review(Guid id, ReviewExtractionReqDto request, CancellationToken ct)
    {
        var (dataReviewed, financialPolicyReviewed) = await _reviewContractExtractionUseCase.ExecuteAsync(id, request, ct);
        return Ok(new { isSuccess = true, data = new { dataReviewed, financialPolicyReviewed } });
    }

    [HttpPost("{id:guid}/submit")]
    public async Task<IActionResult> Submit(Guid id, CancellationToken ct)
    {
        await _submitContractForReviewUseCase.ExecuteAsync(id, ct);
        return Ok(new { isSuccess = true, data = new { status = "PendingReview" } });
    }

    [HttpPost("{id:guid}/return")]
    public async Task<IActionResult> Return(Guid id, ReviewDecisionReqDto request, CancellationToken ct)
    {
        await _returnContractUseCase.ExecuteAsync(id, request, ct);
        return Ok(new { isSuccess = true, data = new { status = "Draft" } });
    }

    [HttpPost("{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, CancellationToken ct)
    {
        var revision = await _approveContractUseCase.ExecuteAsync(id, ct);
        return Ok(new { isSuccess = true, data = new { status = "ReadyToSign", revision } });
    }

    [HttpPost("{id:guid}/sign")]
    public async Task<IActionResult> Sign(Guid id, SignContractReqDto request, CancellationToken ct)
    {
        var (revision, contentHash) = await _signContractUseCase.ExecuteAsync(id, request, ct);
        return Ok(new { isSuccess = true, data = new { status = "Signed", revision, contentHash } });
    }

    [HttpPost("{id:guid}/activate")]
    public async Task<IActionResult> Activate(Guid id, CancellationToken ct)
    {
        var (alreadyApplied, appliedMovies) = await _activateContractUseCase.ExecuteAsync(id, ct);
        if (alreadyApplied)
        {
            return Ok(new { isSuccess = true, data = new { status = "Activated", alreadyApplied = true } });
        }
        return Ok(new { isSuccess = true, data = new { status = "Activated", appliedMovies } });
    }

    [HttpPost("{id:guid}/suspend")]
    public async Task<IActionResult> Suspend(Guid id, ReviewDecisionReqDto request, CancellationToken ct)
    {
        var status = await _suspendContractUseCase.ExecuteAsync(id, request, ct);
        return Ok(new { isSuccess = true, data = new { status } });
    }

    [HttpPost("{id:guid}/resume")]
    public async Task<IActionResult> Resume(Guid id, ReviewDecisionReqDto request, CancellationToken ct)
    {
        var status = await _resumeContractUseCase.ExecuteAsync(id, request, ct);
        return Ok(new { isSuccess = true, data = new { status } });
    }

    [HttpPost("{id:guid}/terminate")]
    public async Task<IActionResult> Terminate(Guid id, ReviewDecisionReqDto request, CancellationToken ct)
    {
        var status = await _terminateContractUseCase.ExecuteAsync(id, request, ct);
        return Ok(new { isSuccess = true, data = new { status } });
    }

    [HttpGet("revenue/movies")]
    public async Task<IActionResult> MovieRevenue([FromQuery] DateTime? from, [FromQuery] DateTime? to, CancellationToken ct)
    {
        var report = await _getMovieRevenueReconciliationUseCase.ExecuteAsync(from, to, ct);
        return Ok(new { isSuccess = true, data = report });
    }
}
