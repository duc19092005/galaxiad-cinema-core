using Cinema.Application.Dtos.MovieManager.Contracts;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Contracts;
using Cinema.Application.Interfaces.IIdentityAccess;
using Cinema.Application.UseCases.MovieManager.Contracts;
using Cinema.Application.UseCases.MovieManager.ContractTemplates;
using Cinema.Application.UseCases.MovieManager.MovieChangeRequests;
using Cinema.Domain.Entities.Contracts;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Enums;
using FluentAssertions;
using Moq;
using Xunit;

namespace Cinema.Tests.Unit.Contracts;

public class ContractUseCasesTests
{
    private readonly Mock<IContractRepository> _repoMock = new();
    private readonly Mock<IUserContextService> _userContextMock = new();
    private readonly Mock<IPasswordHasher> _hasherMock = new();

    private readonly Guid _userId = Guid.NewGuid();

    public ContractUseCasesTests()
    {
        _userContextMock.Setup(u => u.GetUserId()).Returns(_userId);
        _userContextMock.Setup(u => u.IsInRole("Admin")).Returns(true);
    }

    [Fact]
    public async Task CreateContractUseCase_ValidAssignee_CreatesContractSuccessfully()
    {
        // Arrange
        _repoMock.Setup(r => r.CanAssignUserAsync(_userId, default)).ReturnsAsync(true);
        _repoMock.Setup(r => r.NextContractCodeAsync(default)).ReturnsAsync("HD-2026-0001");
        _repoMock.Setup(r => r.AddContractAsync(It.IsAny<FilmContractEntity>(), It.IsAny<ContractRevisionEntity>(), default))
            .Returns(Task.CompletedTask);

        var useCase = new CreateContractUseCase(_repoMock.Object, _userContextMock.Object);
        var req = new CreateContractReqDto("NUM-123", null, "Distributor Alpha", false, _userId, null);

        // Act
        var result = await useCase.ExecuteAsync(req, default);

        // Assert
        result.InternalCode.Should().Be("HD-2026-0001");
        result.ContractId.Should().NotBeEmpty();
        _repoMock.Verify(r => r.AddContractAsync(It.IsAny<FilmContractEntity>(), It.IsAny<ContractRevisionEntity>(), default), Times.Once);
    }

    [Fact]
    public async Task CreateContractUseCase_InvalidAssignee_ThrowsAppException()
    {
        // Arrange
        _repoMock.Setup(r => r.CanAssignUserAsync(_userId, default)).ReturnsAsync(false);
        var useCase = new CreateContractUseCase(_repoMock.Object, _userContextMock.Object);
        var req = new CreateContractReqDto("NUM-123", null, "Distributor Alpha", false, _userId, null);

        // Act & Assert
        var act = () => useCase.ExecuteAsync(req, default);
        await act.Should().ThrowAsync<AppException>()
            .Where(e => e.ErrorCode == "INVALID_ASSIGNEE" && e.StatusCode == 400);
    }

    [Fact]
    public async Task SubmitContractForReviewUseCase_DraftContract_TransitionsToPendingReview()
    {
        // Arrange
        var contractId = Guid.NewGuid();
        var contract = new FilmContractEntity { ContractId = contractId, Status = ContractStatus.Draft };
        var revision = new ContractRevisionEntity
        {
            ContractRevisionId = Guid.NewGuid(),
            DataReviewed = true,
            FinancialPolicyReviewed = true,
            Documents = [new ContractDocumentEntity { FileName = "contract.pdf" }],
            MovieLines =
            [
                new ContractMovieLineEntity
                {
                    VietnameseTitle = "Phim Test",
                    DurationMinutes = 120,
                    MovieRequiredAgeId = Guid.NewGuid(),
                    LicenseStartAt = DateTime.UtcNow,
                    LicenseEndAt = DateTime.UtcNow.AddMonths(1),
                    CinemaScopeState = ContractScopeState.NoAdditionalRestrictionConfirmed,
                    FormatScopeState = ContractScopeState.NoAdditionalRestrictionConfirmed,
                    CinemaSharePercent = 50,
                    DistributorSharePercent = 50,
                    Reviewed = true
                }
            ]
        };

        _repoMock.Setup(r => r.GetEditableContractAsync(contractId, _userId, true, default)).ReturnsAsync(contract);
        _repoMock.Setup(r => r.GetCurrentRevisionAsync(contractId, default)).ReturnsAsync(revision);

        var useCase = new SubmitContractForReviewUseCase(_repoMock.Object, _userContextMock.Object);

        // Act
        await useCase.ExecuteAsync(contractId, default);

        // Assert
        contract.Status.Should().Be(ContractStatus.PendingReview);
        _repoMock.Verify(r => r.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task ApproveContractUseCase_NonAdmin_ThrowsForbidden()
    {
        // Arrange
        _userContextMock.Setup(u => u.IsInRole("Admin")).Returns(false);
        var useCase = new ApproveContractUseCase(_repoMock.Object, _userContextMock.Object);

        // Act & Assert
        var act = () => useCase.ExecuteAsync(Guid.NewGuid(), default);
        await act.Should().ThrowAsync<AppException>()
            .Where(e => e.StatusCode == 403);
    }

    [Fact]
    public async Task SignContractUseCase_InvalidPassword_ThrowsUnauthorized()
    {
        // Arrange
        _repoMock.Setup(r => r.GetUserPasswordHashAsync(_userId, default)).ReturnsAsync("hashed_pw");
        _hasherMock.Setup(h => h.Validate("hashed_pw", "wrong_password")).Returns(false);

        var useCase = new SignContractUseCase(_repoMock.Object, _userContextMock.Object, _hasherMock.Object);
        var req = new SignContractReqDto("wrong_password");

        // Act & Assert
        var act = () => useCase.ExecuteAsync(Guid.NewGuid(), req, default);
        await act.Should().ThrowAsync<AppException>()
            .Where(e => e.ErrorCode == "SIGN_PASSWORD_INVALID" && e.StatusCode == 401);
    }

    [Fact]
    public async Task CreateContractTemplateUseCase_AdminUser_CreatesTemplateDraft()
    {
        // Arrange
        _repoMock.Setup(r => r.GetNextTemplateVersionAsync("STD", default)).ReturnsAsync(1);
        _repoMock.Setup(r => r.AddTemplateAsync(It.IsAny<ContractTemplateEntity>(), default)).Returns(Task.CompletedTask);

        var useCase = new CreateContractTemplateUseCase(_repoMock.Object, _userContextMock.Object);
        var req = new CreateContractTemplateReqDto("STD", "Standard Template", "{}", "Body");

        // Act
        var result = await useCase.ExecuteAsync(req, default);

        // Assert
        result.Code.Should().Be("STD");
        result.Version.Should().Be(1);
        result.Status.Should().Be(ContractTemplateStatus.Draft.ToString());
    }

    [Fact]
    public async Task CreateMovieChangeRequestUseCase_DisallowedField_ThrowsBadRequest()
    {
        // Arrange
        var movieId = Guid.NewGuid();
        var movie = new MovieInfoEntity { MovieId = movieId, MovieManagerId = _userId };
        _repoMock.Setup(r => r.GetMovieByIdAsync(movieId, default)).ReturnsAsync(movie);

        var useCase = new CreateMovieChangeRequestUseCase(_repoMock.Object, _userContextMock.Object);
        // "ticketPrice" is not allowed in AllowedMetadata (only description, urls, director, actors)
        var req = new CreateMovieChangeRequestDto("Update ticket price", "{\"ticketPrice\": 100000}");

        // Act & Assert
        var act = () => useCase.ExecuteAsync(movieId, req, default);
        await act.Should().ThrowAsync<AppException>()
            .Where(e => e.ErrorCode == "CONTRACT_CHANGE_REQUIRED" && e.StatusCode == 400);
    }
}
