using System.Text.Json;
using Cinema.Application.Dtos.MovieManager.Contracts;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Contracts;
using Cinema.Application.UseCases.MovieManager.Contracts;
using Cinema.Domain.Entities.Contracts;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;
using FluentAssertions;
using Moq;
using Xunit;

namespace Cinema.Tests.Unit.Contracts;

public class ContractReviewWorkflowTests
{
    [Fact]
    public async Task MovieManager_CannotAssignEvenWithValidTarget()
    {
        var repository = new Mock<IContractRepository>();
        var user = new Mock<IUserContextService>();
        var useCase = new AssignContractUseCase(repository.Object, user.Object);
        await FluentActions.Invoking(() => useCase.ExecuteAsync(Guid.NewGuid(), Guid.NewGuid(), default))
            .Should().ThrowAsync<AppException>().Where(e => e.StatusCode == 403);
        repository.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Admin_AssignsOnlyEligibleManager_AndClearsPreviousReview()
    {
        var id = Guid.NewGuid(); var manager = Guid.NewGuid();
        var contract = new FilmContractEntity { ContractId = id, ProcessingStatus = ContractProcessingStatus.AwaitingDataApproval };
        var revision = new ContractRevisionEntity { DataReviewed = true, FinancialPolicyReviewed = true };
        var repository = new Mock<IContractRepository>();
        repository.Setup(r => r.GetContractByIdAsync(id, default)).ReturnsAsync(contract);
        repository.Setup(r => r.GetCurrentRevisionAsync(id, default)).ReturnsAsync(revision);
        repository.Setup(r => r.ListReviewersAsync(default)).ReturnsAsync([new(manager, "Reviewer")]);
        var user = new Mock<IUserContextService>(); user.Setup(u => u.IsInRole("Admin")).Returns(true);
        await new AssignContractUseCase(repository.Object, user.Object).ExecuteAsync(id, manager, default);
        contract.AssignedMovieManagerId.Should().Be(manager);
        revision.DataReviewed.Should().BeFalse();
        revision.FinancialPolicyReviewed.Should().BeFalse();
        revision.ReviewedDataJson.Should().Contain("ASSIGN");
    }

    [Fact]
    public async Task Review_PreservesPreviousEditsAndActor_WithoutCreatingMovie()
    {
        var id = Guid.NewGuid(); var actor = Guid.NewGuid();
        var contract = new FilmContractEntity(); var revision = new ContractRevisionEntity();
        var repository = new Mock<IContractRepository>();
        var transaction = new Mock<IUnitOfWorkTransaction>();
        repository.Setup(r => r.BeginTransactionAsync(default)).ReturnsAsync(transaction.Object);
        repository.Setup(r => r.GetEditableContractAsync(id, actor, false, default)).ReturnsAsync(contract);
        repository.Setup(r => r.GetCurrentRevisionAsync(id, default)).ReturnsAsync(revision);
        var user = new Mock<IUserContextService>(); user.Setup(u => u.GetUserId()).Returns(actor);
        var useCase = new ReviewContractExtractionUseCase(repository.Object, user.Object);
        await useCase.ExecuteAsync(id, new([new() { VietnameseTitle = "Bản đầu" }], false), default);
        await useCase.ExecuteAsync(id, new([new() { VietnameseTitle = "Bản sửa", Description = "Tiếng Việt" }], true), default);
        using var history = JsonDocument.Parse(revision.ReviewedDataJson);
        var latest = history.RootElement.GetProperty("events")[1];
        latest.GetProperty("actorId").GetGuid().Should().Be(actor);
        latest.GetProperty("before").GetProperty("movieLines")[0].GetProperty("vietnameseTitle").GetString().Should().Be("Bản đầu");
        latest.GetProperty("after").GetProperty("movieLines")[0].GetProperty("description").GetString().Should().Be("Tiếng Việt");
        repository.Verify(r => r.AddMovieAsync(It.IsAny<Cinema.Domain.Entities.MovieInfos.MovieInfoEntity>(), default), Times.Never);
        transaction.Verify(t => t.CommitAsync(default), Times.Exactly(2));
    }

    [Fact]
    public async Task Review_OutsideAssignmentReturnsNotFound()
    {
        var repository = new Mock<IContractRepository>(); var user = new Mock<IUserContextService>();
        var useCase = new ReviewContractExtractionUseCase(repository.Object, user.Object);
        await FluentActions.Invoking(() => useCase.ExecuteAsync(Guid.NewGuid(), new([], false), default))
            .Should().ThrowAsync<AppException>().Where(e => e.StatusCode == 404);
        repository.Verify(r => r.SaveChangesAsync(default), Times.Never);
    }

    [Fact]
    public void SignatureHashCoversDescriptionAndPoster()
    {
        var line = new ContractMovieLineEntity { Description = "Nguồn", PosterUrl = "https://example.org/one" };
        var revision = new ContractRevisionEntity { MovieLines = [line] };
        var hash = ContractRevisionValidator.Hash(revision);
        line.Description = "Đã sửa";
        ContractRevisionValidator.Hash(revision).Should().NotBe(hash);
        line.Description = "Nguồn"; line.PosterUrl = "https://example.org/two";
        ContractRevisionValidator.Hash(revision).Should().NotBe(hash);
    }
}
