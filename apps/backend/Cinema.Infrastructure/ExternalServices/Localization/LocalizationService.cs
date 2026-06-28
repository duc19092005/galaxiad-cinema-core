using System.Text.Json;
using System.Text.RegularExpressions;
using System.Text;
using Microsoft.AspNetCore.Http;

namespace Cinema.Domain.Localization;

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
    //  Translation data loaded from JSON
    // ──────────────────────────────────────────────

    // Exact string: EN -> VI
    private static readonly Dictionary<string, string> EnToViTranslations = new(StringComparer.OrdinalIgnoreCase);

    // Exact string: EN -> RU
    private static readonly Dictionary<string, string> EnToRuTranslations = new(StringComparer.OrdinalIgnoreCase);

    // Reverse: VI -> EN
    private static readonly Dictionary<string, string> ViToEnTranslations = new(StringComparer.OrdinalIgnoreCase);

    // Reverse: RU -> EN
    private static readonly Dictionary<string, string> RuToEnTranslations = new(StringComparer.OrdinalIgnoreCase);

    // Regex-based translations: (Pattern, Replacement) - EN patterns, localized replacement
    private static readonly List<(Regex Pattern, string Replacement)> ViRegexTranslations = new();
    private static readonly List<(Regex Pattern, string Replacement)> RuRegexTranslations = new();

    // Cross: VI -> RU
    private static readonly Dictionary<string, string> ViToRuTranslations = new(StringComparer.OrdinalIgnoreCase);

    // Cross: RU -> VI
    private static readonly Dictionary<string, string> RuToViTranslations = new(StringComparer.OrdinalIgnoreCase);

    static LocalizationService()
    {
        LoadFromJson();
    }

    private static void LoadFromJson()
    {
        var baseDir = FindBaseDirectory();
        if (baseDir == null)
        {
            Console.Error.WriteLine("[LocalizationService] Localization directory not found. Translations will be unavailable.");
            return;
        }

        try
        {
            // Load exact translations: each file is { "exact": { "enKey": "translatedValue" }, "regex": [...] }
            LoadLanguageFile(Path.Combine(baseDir, "vi.json"), EnToViTranslations, ViRegexTranslations);
            LoadLanguageFile(Path.Combine(baseDir, "ru.json"), EnToRuTranslations, RuRegexTranslations);

            // Build reverse maps: translatedText -> English key
            foreach (var kvp in EnToViTranslations)
                if (!ViToEnTranslations.ContainsKey(kvp.Value))
                    ViToEnTranslations[kvp.Value] = kvp.Key;

            foreach (var kvp in EnToRuTranslations)
                if (!RuToEnTranslations.ContainsKey(kvp.Value))
                    RuToEnTranslations[kvp.Value] = kvp.Key;

            // Build cross maps: VI <-> RU  (common English key serves as bridge)
            foreach (var kvp in EnToViTranslations)
            {
                if (EnToRuTranslations.TryGetValue(kvp.Key, out var ruValue))
                {
                    ViToRuTranslations[kvp.Value] = ruValue;
                    RuToViTranslations[ruValue] = kvp.Value;
                }
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[LocalizationService] Failed to load localization files: {ex.Message}");
        }
    }

    private static string? FindBaseDirectory()
    {
        // Try multiple locations for different runtime environments (Docker, dev, etc.)
        string[] candidates =
        [
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "ExternalServices", "Localization"),
            Path.Combine(Directory.GetCurrentDirectory(), "ExternalServices", "Localization"),
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

    public LocalizationService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
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

        var lang = CurrentLanguage;

        // ─── Target: Vietnamese ───
        if (lang == "vi")
        {
            // Direct EN -> VI
            if (EnToViTranslations.TryGetValue(key, out var viValue))
                return viValue;

            // RU -> VI (via EN as bridge)
            if (RuToEnTranslations.TryGetValue(key, out var enViaRu) &&
                EnToViTranslations.TryGetValue(enViaRu, out var viViaRu))
                return viViaRu;

            // Direct VI -> VI (key is already VI, check reverse map to confirm it's a known VI string)
            if (ViToEnTranslations.ContainsKey(key) || ViToRuTranslations.ContainsKey(key))
                return key;

            // Regex (EN patterns since messages are EN keys)
            foreach (var (pattern, replacement) in ViRegexTranslations)
            {
                if (pattern.IsMatch(key))
                    return pattern.Replace(key, replacement);
            }

            return key;
        }

        // ─── Target: Russian ───
        if (lang == "ru")
        {
            // Direct EN -> RU
            if (EnToRuTranslations.TryGetValue(key, out var ruValue))
                return ruValue;

            // VI -> RU (via EN as bridge)
            if (ViToEnTranslations.TryGetValue(key, out var enViaVi) &&
                EnToRuTranslations.TryGetValue(enViaVi, out var ruViaEn))
                return ruViaEn;

            // Direct RU -> RU (key is already RU)
            if (RuToEnTranslations.ContainsKey(key) || RuToViTranslations.ContainsKey(key))
                return key;

            // Regex
            foreach (var (pattern, replacement) in RuRegexTranslations)
            {
                if (pattern.IsMatch(key))
                    return pattern.Replace(key, replacement);
            }

            return key;
        }

        // ─── Target: English ───
        // Direct EN
        if (EnToViTranslations.ContainsKey(key) || EnToRuTranslations.ContainsKey(key))
            return key;

        // VI -> EN
        if (ViToEnTranslations.TryGetValue(key, out var enValue))
            return enValue;

        // RU -> EN
        if (RuToEnTranslations.TryGetValue(key, out var enFromRu))
            return enFromRu;

        // Cross: VI -> RU -> EN (if somehow only RU has the translation)
        if (ViToRuTranslations.ContainsKey(key) || RuToViTranslations.ContainsKey(key))
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
