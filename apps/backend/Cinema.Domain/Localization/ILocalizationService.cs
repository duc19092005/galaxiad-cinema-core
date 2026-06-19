namespace Cinema.Domain.Localization;

public interface ILocalizationService
{
    /// <summary>
    /// Translates a message key or English text to the target language.
    /// </summary>
    /// <param name="key">The message key or original English text</param>
    /// <returns>Translated text based on current language context</returns>
    string Translate(string key);

    /// <summary>
    /// Gets the current language code (e.g., "vi", "en")
    /// </summary>
    string CurrentLanguage { get; }
}
