using System.Text.Json;
using System.Text.RegularExpressions;
using System.Text;
using Microsoft.AspNetCore.Http;
using Cinema.Domain.Localization;

namespace Cinema.Infrastructure.ExternalServices.Localization;

/// <summary>
/// Handles translation of application messages using data loaded from vi.json and ru.json.
/// Supports Vietnamese (vi) and Russian (ru) via exact string matching and regex-based dynamic translation.
/// Language is determined from X-Language header or Accept-Language header.
/// </summary>
public class LocalizationService : ILocalizationService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    private const string DefaultLanguage = "en";
    private const string HeaderXLanguage = "X-Language";
    private const string HeaderAcceptLanguage = "Accept-Language";
    private static readonly HashSet<string> SupportedLanguages = new() { "en", "vi", "ru" };

    // ──────────────────────────────────────────────
    //  Translation data loaded from JSON (lazily initialized)
    // ──────────────────────────────────────────────

    private static readonly Lazy<TranslationData> _translations = new(LoadFromJson);

    // Exact string: EN -> VI
    private static Dictionary<string, string> EnToViTranslations => _translations.Value.EnToVi;
    // Exact string: EN -> RU
    private static Dictionary<string, string> EnToRuTranslations => _translations.Value.EnToRu;
    // Reverse: VI -> EN
    private static Dictionary<string, string> ViToEnTranslations => _translations.Value.ViToEn;
    // Reverse: RU -> EN
    private static Dictionary<string, string> RuToEnTranslations => _translations.Value.RuToEn;
    // Regex-based translations: (Pattern, Replacement) - EN patterns, localized replacement
    private static List<(Regex Pattern, string Replacement)> ViRegexTranslations => _translations.Value.ViRegex;
    private static List<(Regex Pattern, string Replacement)> RuRegexTranslations => _translations.Value.RuRegex;
    // Cross: VI -> RU
    private static Dictionary<string, string> ViToRuTranslations => _translations.Value.ViToRu;
    // Cross: RU -> VI
    private static Dictionary<string, string> RuToViTranslations => _translations.Value.RuToVi;

    public LocalizationService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private class TranslationData
    {
        public Dictionary<string, string> EnToVi { get; } = new(StringComparer.OrdinalIgnoreCase);
        public Dictionary<string, string> EnToRu { get; } = new(StringComparer.OrdinalIgnoreCase);
        public Dictionary<string, string> ViToEn { get; } = new(StringComparer.OrdinalIgnoreCase);
        public Dictionary<string, string> RuToEn { get; } = new(StringComparer.OrdinalIgnoreCase);
        public List<(Regex Pattern, string Replacement)> ViRegex { get; } = new();
        public List<(Regex Pattern, string Replacement)> RuRegex { get; } = new();
        public Dictionary<string, string> ViToRu { get; } = new(StringComparer.OrdinalIgnoreCase);
        public Dictionary<string, string> RuToVi { get; } = new(StringComparer.OrdinalIgnoreCase);
    }

    private static TranslationData LoadFromJson()
    {
        var data = new TranslationData();
        var baseDir = FindBaseDirectory();
        if (baseDir == null)
        {
            Console.Error.WriteLine("[LocalizationService] Localization directory not found. Translations will be unavailable.");
            return data;
        }

        try
        {
            // Load exact translations: each file is { "exact": { "enKey": "translatedValue" }, "regex": [...] }
            LoadLanguageFile(Path.Combine(baseDir, "vi.json"), data.EnToVi, data.ViRegex);
            LoadLanguageFile(Path.Combine(baseDir, "ru.json"), data.EnToRu, data.RuRegex);

            // Build reverse maps: translatedText -> English key
            foreach (var kvp in data.EnToVi)
                if (!data.ViToEn.ContainsKey(kvp.Value))
                    data.ViToEn[kvp.Value] = kvp.Key;

            foreach (var kvp in data.EnToRu)
                if (!data.RuToEn.ContainsKey(kvp.Value))
                    data.RuToEn[kvp.Value] = kvp.Key;

            // Build cross maps: VI <-> RU  (common English key serves as bridge)
            foreach (var kvp in data.EnToVi)
            {
                if (data.EnToRu.TryGetValue(kvp.Key, out var ruValue))
                {
                    data.ViToRu[kvp.Value] = ruValue;
                    data.RuToVi[ruValue] = kvp.Value;
                }
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[LocalizationService] Failed to load localization files: {ex.Message}");
        }

        return data;
    }

    private static string? FindBaseDirectory()
    {
        // Try multiple locations for different runtime environments (Docker, dev, etc.)
        string[] candidates =
        [
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "ExternalServices", "Localization"),
            Path.Combine(Directory.GetCurrentDirectory(), "ExternalServices", "Localization"),
            // Docker dotnet watch: CWD is in project dir (e.g. /src/Cinema.Api), files in Infrastructure project
            Path.Combine(Directory.GetCurrentDirectory(), "..", "Cinema.Infrastructure", "ExternalServices", "Localization"),
            // Docker: files are copied to output
            AppContext.BaseDirectory,
            Directory.GetCurrentDirectory(),
        ];

        foreach (var dir in candidates)
        {
            var resolved = Path.GetFullPath(dir);
            if (File.Exists(Path.Combine(resolved, "vi.json")) && File.Exists(Path.Combine(resolved, "ru.json")))
                return resolved;
        }

        return null;
    }

    private static void LoadLanguageFile(
        string filePath,
        Dictionary<string, string> targetDict,
        List<(Regex Pattern, string Replacement)> regexTranslations)
    {
        if (!File.Exists(filePath)) return;

        var json = File.ReadAllText(filePath, Encoding.UTF8);
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        // Load exact translations
        if (root.TryGetProperty("exact", out var exact))
        {
            foreach (var entry in exact.EnumerateObject())
            {
                var value = entry.Value.GetString();
                if (value != null)
                    targetDict[entry.Name] = value;
            }
        }

        // Load regex translations
        if (root.TryGetProperty("regex", out var regexArr))
        {
            foreach (var item in regexArr.EnumerateArray())
            {
                var pattern = item.GetProperty("pattern").GetString();
                var replacement = item.GetProperty("replacement").GetString();
                if (pattern != null && replacement != null)
                {
                    try
                    {
                        regexTranslations.Add((new Regex(pattern, RegexOptions.IgnoreCase), replacement));
                    }
                    catch (Exception ex)
                    {
                        Console.Error.WriteLine($"[LocalizationService] Invalid regex pattern '{pattern}': {ex.Message}");
                    }
                }
            }
        }
    }

    public string CurrentLanguage
    {
        get
        {
            var lang = GetLanguageFromHeader();
            return SupportedLanguages.Contains(lang) ? lang : DefaultLanguage;
        }
    }

    public string Translate(string key)
    {
        if (string.IsNullOrEmpty(key)) return key;

        // Sanitize: trim trailing dots to support keys stored without dots
        var sanitizedKey = key.TrimEnd('.');
        var lang = CurrentLanguage;

        // ─── Target: Vietnamese ───
        if (lang == "vi")
        {
            // Direct EN -> VI
            if (EnToViTranslations.TryGetValue(sanitizedKey, out var viValue))
                return viValue;

            // RU -> VI (via EN as bridge)
            if (RuToEnTranslations.TryGetValue(sanitizedKey, out var enViaRu) &&
                EnToViTranslations.TryGetValue(enViaRu, out var viViaRu))
                return viViaRu;

            // Direct VI -> VI (key is already VI, check reverse map to confirm it's a known VI string)
            if (ViToEnTranslations.ContainsKey(sanitizedKey) || ViToRuTranslations.ContainsKey(sanitizedKey))
                return key;

            // Regex (EN patterns since messages are EN keys)
            foreach (var (pattern, replacement) in ViRegexTranslations)
            {
                if (pattern.IsMatch(sanitizedKey))
                    return pattern.Replace(sanitizedKey, replacement);
            }

            return key;
        }

        // ─── Target: Russian ───
        if (lang == "ru")
        {
            // Direct EN -> RU
            if (EnToRuTranslations.TryGetValue(sanitizedKey, out var ruValue))
                return ruValue;

            // VI -> RU (via EN as bridge)
            if (ViToEnTranslations.TryGetValue(sanitizedKey, out var enViaVi) &&
                EnToRuTranslations.TryGetValue(enViaVi, out var ruViaEn))
                return ruViaEn;

            // Direct RU -> RU (key is already RU)
            if (RuToEnTranslations.ContainsKey(sanitizedKey) || RuToViTranslations.ContainsKey(sanitizedKey))
                return key;

            // Regex
            foreach (var (pattern, replacement) in RuRegexTranslations)
            {
                if (pattern.IsMatch(sanitizedKey))
                    return pattern.Replace(sanitizedKey, replacement);
            }

            return key;
        }

        // ─── Target: English ───
        // Direct EN
        if (EnToViTranslations.ContainsKey(sanitizedKey) || EnToRuTranslations.ContainsKey(sanitizedKey))
            return key;

        // VI -> EN
        if (ViToEnTranslations.TryGetValue(sanitizedKey, out var enValue))
            return enValue;

        // RU -> EN
        if (RuToEnTranslations.TryGetValue(sanitizedKey, out var enFromRu))
            return enFromRu;

        // Cross: VI -> RU -> EN (if somehow only RU has the translation)
        if (ViToRuTranslations.ContainsKey(sanitizedKey) || RuToViTranslations.ContainsKey(sanitizedKey))
            return key;

        // Regex
        return key;
    }

    private string GetLanguageFromHeader()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null) return DefaultLanguage;

        // 1. Custom X-Language header (highest priority)
        if (httpContext.Request.Headers.TryGetValue(HeaderXLanguage, out var xLang))
        {
            var langValue = xLang.ToString().Trim().ToLower();
            if (SupportedLanguages.Contains(langValue))
                return langValue;
        }

        // 2. Fallback to Accept-Language
        if (httpContext.Request.Headers.TryGetValue(HeaderAcceptLanguage, out var acceptLang))
        {
            var headerValue = acceptLang.ToString().ToLower();
            var languages = headerValue.Split(',')
                .Select(l => l.Split(';')[0].Split('-')[0].Trim())
                .Where(l => !string.IsNullOrEmpty(l));

            foreach (var lang in languages)
            {
                if (SupportedLanguages.Contains(lang))
                    return lang;
            }
        }

        return DefaultLanguage;
    }
}
