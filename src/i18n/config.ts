import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslations from './locales/en/translation.json';
import viTranslations from './locales/vi/translation.json';
import ruTranslations from './locales/ru/translation.json';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                translation: enTranslations
            },
            vi: {
                translation: viTranslations
            },
            ru: {
                translation: ruTranslations
            }
        },
        lng: localStorage.getItem('language') || 'vi', // Load language
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false // React already does escaping
        }
    });

i18n.on('languageChanged', (lng) => {
    localStorage.setItem('language', lng);
});

export default i18n;
