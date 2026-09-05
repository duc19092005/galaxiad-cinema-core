using Bogus;

namespace Cinema.Testing.Fixtures;

public static class FakeDataGenerator
{
    private static readonly Faker _faker = new Faker("vi");

    public static string FakeEmail() => _faker.Internet.Email();
    public static string FakeName() => _faker.Name.FullName();
    public static string FakePhone() => _faker.Phone.PhoneNumber("0#########");
    public static string FakePassword() => $"P@ss{_faker.Random.AlphaNumeric(8)}1!";
    public static Guid FakeGuid() => _faker.Random.Guid();
    public static string FakeIdentityCard() => _faker.Random.Replace("############");

    public static Dictionary<string, object> FakeMovieData() => new()
    {
        ["title"] = _faker.Lorem.Sentence(3),
        ["description"] = _faker.Lorem.Paragraph(),
        ["duration"] = _faker.Random.Int(80, 180),
        ["releaseDate"] = _faker.Date.Future(1).ToString("yyyy-MM-dd"),
        ["posterUrl"] = _faker.Image.PicsumUrl(),
    };

    public static Dictionary<string, object> FakeCinemaData() => new()
    {
        ["cinemaName"] = $"Cinema {_faker.Address.City()}",
        ["address"] = _faker.Address.FullAddress(),
        ["city"] = _faker.Address.City(),
        ["latitude"] = _faker.Address.Latitude(),
        ["longitude"] = _faker.Address.Longitude(),
    };
}
