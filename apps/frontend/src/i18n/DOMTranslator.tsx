import React, { useEffect, useState, useRef, useCallback } from 'react';
import enDict from './locales/en/translation.json';
import viDict from './locales/vi/translation.json';
import ruDict from './locales/ru/translation.json';
import i18n from './config';

/**
 * Flatten nested JSON object with dot-separated paths.
 * { a: { b: "hello" } } => { "a.b": "hello" }
 */
const flattenWithPaths = (obj: Record<string, any>, prefix = ''): Record<string, string> => {
    const result: Record<string, string> = {};
    for (const key in obj) {
        const value = obj[key];
        const path = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'string') {
            result[path] = value;
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            Object.assign(result, flattenWithPaths(value, path));
        }
    }
    return result;
};

// Build flattened dictionaries with dot paths (e.g. "sidebar.language": "Language")
const EN_FLAT = flattenWithPaths(enDict as Record<string, any>);
const VI_FLAT = flattenWithPaths(viDict as Record<string, any>);
const RU_FLAT = flattenWithPaths(ruDict as Record<string, any>);

// ============================================================
// Build translation maps: English display text -> Target display text
// ============================================================

// EN -> VI: match by same dot-path
const EN_TO_VI: Record<string, string> = {};
for (const path in EN_FLAT) {
    const enText = EN_FLAT[path];
    if (VI_FLAT[path]) {
        EN_TO_VI[enText] = VI_FLAT[path];
    }
}

// EN -> RU
const EN_TO_RU: Record<string, string> = {};
for (const path in EN_FLAT) {
    const enText = EN_FLAT[path];
    if (RU_FLAT[path]) {
        EN_TO_RU[enText] = RU_FLAT[path];
    }
}

// Reverse maps: target display text -> English display text
const VI_TO_EN: Record<string, string> = {};
for (const enText in EN_TO_VI) {
    VI_TO_EN[EN_TO_VI[enText]] = enText;
}

const RU_TO_EN: Record<string, string> = {};
for (const enText in EN_TO_RU) {
    RU_TO_EN[EN_TO_RU[enText]] = enText;
}

// All known texts (EN, VI, RU) for quick lookup
const ALL_KNOWN_TEXTS = new Set<string>([
    ...Object.keys(EN_TO_VI),        // English texts
    ...Object.keys(VI_TO_EN),        // Vietnamese texts
    ...Object.keys(RU_TO_EN),        // Russian texts
]);

/**
 * Translate a single text string given the target language.
 */
function translateText(text: string, lang: string): string | null {
    if (!text) return null;

    if (lang === 'vi') {
        // EN/current -> VI
        if (EN_TO_VI[text]) return EN_TO_VI[text];
        // RU -> EN -> VI
        if (RU_TO_EN[text] && EN_TO_VI[RU_TO_EN[text]]) return EN_TO_VI[RU_TO_EN[text]];
        // Already VI, return as-is
        if (VI_TO_EN[text]) return text;
        return null;
    }

    if (lang === 'ru') {
        // EN -> RU
        if (EN_TO_RU[text]) return EN_TO_RU[text];
        // VI -> EN -> RU
        if (VI_TO_EN[text] && EN_TO_RU[VI_TO_EN[text]]) return EN_TO_RU[VI_TO_EN[text]];
        // Already RU, return as-is
        if (RU_TO_EN[text]) return text;
        return null;
    }

    // lang === 'en'
    // VI -> EN
    if (VI_TO_EN[text]) return VI_TO_EN[text];
    // RU -> EN
    if (RU_TO_EN[text]) return RU_TO_EN[text];
    // Already EN, return as-is
    if (EN_TO_VI[text]) return text;
    return null;
}

/**
 * Check if text looks like a translatable string (i.e. it exists in our dictionaries).
 */
function isKnownTranslatable(text: string): boolean {
    return ALL_KNOWN_TEXTS.has(text);
}

export const DOMTranslator: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [lang, setLang] = useState(localStorage.getItem('language') || 'en');
    const observerRef = useRef<MutationObserver | null>(null);
    const isTranslatingRef = useRef(false);

    // Listen for language changes from i18next
    useEffect(() => {
        const handleLangChange = (newLang: string) => setLang(newLang);
        i18n.on('languageChanged', handleLangChange);
        return () => { i18n.off('languageChanged', handleLangChange); };
    }, []);

    /**
     * Recursively translate all text nodes and attributes within a node.
     */
    const translateNode = useCallback((node: Node) => {
        if (!node || node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE' || node.nodeName === 'NOSCRIPT') return;

        if (node.nodeType === Node.TEXT_NODE) {
            const raw = node.nodeValue;
            if (!raw) return;
            const trimmed = raw.trim();
            if (!trimmed) return;

            // Check if this text matches any known translatable text
            if (isKnownTranslatable(trimmed)) {
                const translated = translateText(trimmed, lang);
                if (translated && translated !== trimmed) {
                    node.nodeValue = raw.replace(trimmed, translated);
                    return; // skip children since we replaced text
                }
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;

            // Translate placeholder
            const ph = el.getAttribute('placeholder');
            if (ph) {
                const phTrimmed = ph.trim();
                const translated = translateText(phTrimmed, lang);
                if (translated && translated !== phTrimmed) {
                    el.setAttribute('placeholder', translated);
                }
            }

            // Translate title
            const title = el.getAttribute('title');
            if (title) {
                const titleTrimmed = title.trim();
                const translated = translateText(titleTrimmed, lang);
                if (translated && translated !== titleTrimmed) {
                    el.setAttribute('title', translated);
                }
            }
        }

        // Recurse children
        node.childNodes.forEach(child => translateNode(child));
    }, [lang]);

    /**
     * Perform a full pass on the entire DOM inside our wrapper.
     */
    const runFullPass = useCallback(() => {
        if (isTranslatingRef.current) return;
        isTranslatingRef.current = true;
        if (observerRef.current) observerRef.current.disconnect();

        translateNode(document.body);

        if (observerRef.current) {
            observerRef.current.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true,
            });
        }
        isTranslatingRef.current = false;
    }, [translateNode]);

    // Set up MutationObserver
    useEffect(() => {
        const mutationConfig: MutationObserverInit = {
            childList: true,
            subtree: true,
            characterData: true,
        };

        const handleMutations = (mutations: MutationRecord[]) => {
            if (isTranslatingRef.current) return;
            isTranslatingRef.current = true;
            if (observerRef.current) observerRef.current.disconnect();

            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(n => translateNode(n));
                } else if (mutation.type === 'characterData') {
                    translateNode(mutation.target);
                }
            }

            if (observerRef.current) {
                observerRef.current.observe(document.body, mutationConfig);
            }
            isTranslatingRef.current = false;
        };

        observerRef.current = new MutationObserver(handleMutations);

        // Small delay to let React render first
        const timer = setTimeout(runFullPass, 100);

        return () => {
            clearTimeout(timer);
            if (observerRef.current) observerRef.current.disconnect();
        };
    }, [lang, translateNode, runFullPass]);

    // Re-run full pass when lang changes
    useEffect(() => {
        const timer = setTimeout(runFullPass, 50);
        return () => clearTimeout(timer);
    }, [lang, runFullPass]);

    return <>{children}</>;
};
