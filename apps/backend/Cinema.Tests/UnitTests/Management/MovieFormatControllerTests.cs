using Cinema.Api.Controllers.Management.Facilities;
using Cinema.Application.Dtos.FacilitiesManager.MovieInfos.MovieFormats.Responses;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.UseCases.FacilitiesManager.MovieFormat;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;

namespace Cinema.Tests.UnitTests.Management;

public class MovieFormatControllerTests
{
    [Fact]
    public async Task GetAllMovieFormat_ReturnsOk()
    {
        var repository = new Mock<IMovieFormatRepository>();
        repository.Setup(x => x.GetAllMovieFormatsAsync())
            .ReturnsAsync([
                new ResFacilitiesManagerMovieFormatDto { FormatId = Guid.NewGuid(), FormatName = "IMAX" },
                new ResFacilitiesManagerMovieFormatDto { FormatId = Guid.NewGuid(), FormatName = "3D" }
            ]);

        var useCase = new FacilitiesManagerReadMovieFormatUseCase(
            repository.Object,
            Mock.Of<ILogger<FacilitiesManagerReadMovieFormatUseCase>>());
        var controller = new MovieFormatController(useCase);

        var result = await controller.GetAllMovieFormat();

        result.Should().BeOfType<OkObjectResult>();
    }
}
