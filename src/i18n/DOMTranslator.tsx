import React, { useEffect, useState, useRef, useCallback } from 'react';
import viDict from './locales/vi/translation.json';
import ruDict from './locales/ru/translation.json';
import i18n from './config';

/**
 * Dàn phẳng toàn bộ JSON (kể cả lồng nhau) thành 1 từ điển phẳng.
 * VD: { "sidebar": { "dashboard": "Tổng quan" }, "Logout": "Đăng Xuất" }
 *   => { "dashboard": "Tổng quan", "Logout": "Đăng Xuất" }
 */
const flattenDict = (obj: Record<string, any>): Record<string, string> => {
    const result: Record<string, string> = {};
    const recurse = (current: Record<string, any>) => {
        for (const key in current) {
            const value = current[key];
            if (typeof value === 'string') {
                result[key] = value;
            } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                recurse(value);
            }
        }
    };
    recurse(obj);
    return result;
};

// Build từ điển phẳng 1 lần duy nhất khi app khởi động
const VI_DICT: Record<string, string> = flattenDict(viDict as Record<string, any>);

// Tạo từ điển ngược: Tiếng Việt -> Tiếng Anh (để khi switch EN, có thể đổi ngược lại)
const EN_DICT: Record<string, string> = {};
for (const enKey in VI_DICT) {
    EN_DICT[VI_DICT[enKey]] = enKey;
}

// Build từ điển phẳng cho tiếng Nga 1 lần duy nhất
const RU_DICT: Record<string, string> = flattenDict(ruDict as Record<string, any>);

// Tạo từ điển ngược: Tiếng Nga -> Tiếng Anh
const RU_TO_EN_DICT: Record<string, string> = {};
for (const enKey in RU_DICT) {
    RU_TO_EN_DICT[RU_DICT[enKey]] = enKey;
}

export const DOMTranslator: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [lang, setLang] = useState(localStorage.getItem('language') || 'vi');
    const observerRef = useRef<MutationObserver | null>(null);
    const isTranslatingRef = useRef(false);

    // Lắng nghe sự kiện đổi ngôn ngữ
    useEffect(() => {
        const handleLangChange = (newLang: string) => setLang(newLang);
        i18n.on('languageChanged', handleLangChange);
        return () => { i18n.off('languageChanged', handleLangChange); };
    }, []);

    const translateNode = useCallback((node: Node) => {
        if (node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE' || node.nodeName === 'NOSCRIPT') return;

        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.nodeValue?.trim();
            if (!text) return;

            if (lang === 'vi') {
                // Tiếng Anh -> Tiếng Việt
                if (VI_DICT[text]) {
                    node.nodeValue = node.nodeValue!.replace(text, VI_DICT[text]);
                    return;
                }
            } else if (lang === 'ru') {
                // Tiếng Anh -> Tiếng Nga
                if (RU_DICT[text]) {
                    node.nodeValue = node.nodeValue!.replace(text, RU_DICT[text]);
                    return;
                }
                // Tiếng Việt -> Tiếng Nga (qua trung gian Anh)
                if (EN_DICT[text] && RU_DICT[EN_DICT[text]]) {
                    node.nodeValue = node.nodeValue!.replace(text, RU_DICT[EN_DICT[text]]);
                    return;
                }
                // Tiếng Nga -> Tiếng Anh (dùng từ điển ngược)
                if (RU_TO_EN_DICT[text]) {
                    node.nodeValue = node.nodeValue!.replace(text, RU_TO_EN_DICT[text]);
                    return;
                }
            } else {
                // Tiếng Việt -> Tiếng Anh (dùng từ điển ngược)
                if (EN_DICT[text]) {
                    node.nodeValue = node.nodeValue!.replace(text, EN_DICT[text]);
                    return;
                }
                // Tiếng Nga -> Tiếng Anh
                if (RU_TO_EN_DICT[text]) {
                    node.nodeValue = node.nodeValue!.replace(text, RU_TO_EN_DICT[text]);
                    return;
                }
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;

            // Dịch placeholder
            const ph = el.getAttribute('placeholder');
            if (ph) {
                const phTrimmed = ph.trim();
                if (lang === 'vi' && VI_DICT[phTrimmed]) {
                    el.setAttribute('placeholder', VI_DICT[phTrimmed]);
                } else if (lang === 'ru' && RU_DICT[phTrimmed]) {
                    el.setAttribute('placeholder', RU_DICT[phTrimmed]);
                } else if (lang === 'ru' && EN_DICT[phTrimmed] && RU_DICT[EN_DICT[phTrimmed]]) {
                    el.setAttribute('placeholder', RU_DICT[EN_DICT[phTrimmed]]);
                } else if (lang === 'en' && EN_DICT[phTrimmed]) {
                    el.setAttribute('placeholder', EN_DICT[phTrimmed]);
                } else if (lang === 'en' && RU_TO_EN_DICT[phTrimmed]) {
                    el.setAttribute('placeholder', RU_TO_EN_DICT[phTrimmed]);
                }
            }

            // Dịch title attribute
            const title = el.getAttribute('title');
            if (title) {
                const titleTrimmed = title.trim();
                if (lang === 'vi' && VI_DICT[titleTrimmed]) {
                    el.setAttribute('title', VI_DICT[titleTrimmed]);
                } else if (lang === 'ru' && RU_DICT[titleTrimmed]) {
                    el.setAttribute('title', RU_DICT[titleTrimmed]);
                } else if (lang === 'ru' && EN_DICT[titleTrimmed] && RU_DICT[EN_DICT[titleTrimmed]]) {
                    el.setAttribute('title', RU_DICT[EN_DICT[titleTrimmed]]);
                } else if (lang === 'en' && EN_DICT[titleTrimmed]) {
                    el.setAttribute('title', EN_DICT[titleTrimmed]);
                } else if (lang === 'en' && RU_TO_EN_DICT[titleTrimmed]) {
                    el.setAttribute('title', RU_TO_EN_DICT[titleTrimmed]);
                }
            }
        }

        // Đệ quy xuống tất cả child
        node.childNodes.forEach(child => translateNode(child));
    }, [lang]);

    useEffect(() => {
        const mutationConfig: MutationObserverInit = {
            childList: true,
            subtree: true,
            characterData: true,
        };

        const runFullPass = () => {
            if (isTranslatingRef.current) return;
            isTranslatingRef.current = true;
            if (observerRef.current) observerRef.current.disconnect();

            translateNode(document.body);

            if (observerRef.current) observerRef.current.observe(document.body, mutationConfig);
            isTranslatingRef.current = false;
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

            if (observerRef.current) observerRef.current.observe(document.body, mutationConfig);
            isTranslatingRef.current = false;
        };

        observerRef.current = new MutationObserver(handleMutations);

        // Delay nhỏ để React render xong
        const timer = setTimeout(runFullPass, 100);

        return () => {
            clearTimeout(timer);
            if (observerRef.current) observerRef.current.disconnect();
        };
    }, [lang, translateNode]);

    return <>{children}</>;
};
