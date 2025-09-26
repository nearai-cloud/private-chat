import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import enUS from './locales/en-US/translation.json';
import languages from './locales/languages.json';

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: typeof enUS;
    };
  }

}

// Dynamic language loading function
const loadLanguageResource = async (langCode: string) => {
	try {
		const translation = await import(`./locales/${langCode}/translation.json`);
		return translation.default;
	} catch (error) {
		console.warn(`Failed to load language resource for ${langCode}:`, error);
		return null;
	}
};

export const initI18n = async (defaultLocale?: string | undefined) => {
	const detectionOrder = defaultLocale
		? ['querystring', 'localStorage']
		: ['querystring', 'localStorage', 'navigator'];
	const fallbackDefaultLocale = defaultLocale ? [defaultLocale] : ['en-US'];

	// Load all available language resources
	const resources: Record<string, { translation: typeof enUS }> = {};
	
	// Always load English as fallback
	resources['en-US'] = { translation: enUS };
	
	// Load all other languages
	for (const lang of languages) {
		if (lang.code !== 'en-US') {
			const translation = await loadLanguageResource(lang.code);
			if (translation) {
				resources[lang.code] = { translation };
			}
		}
	}

	i18next
		.use(LanguageDetector)
		.use(initReactI18next)
		.init({
			debug: false,
			resources,
			detection: {
				order: detectionOrder,
				caches: ['localStorage'],
				lookupQuerystring: 'lang',
				lookupLocalStorage: 'locale'
			},
			fallbackLng: {
				default: fallbackDefaultLocale
			},
			ns: 'translation',
			defaultNS: 'translation',
			returnEmptyString: false,
			returnNull: false,
			returnObjects: false,
			keySeparator: false,
			nsSeparator: false,
			missingKeyHandler: (lng: readonly string[], ns: string, key: string) => {
				console.error(`Missing translation key: ${key} for language: ${lng.join(',')}`);
			},
			interpolation: {
				escapeValue: false
			}
		});

	const lang = i18next?.language || defaultLocale || 'en-US';
	document.documentElement.setAttribute('lang', lang);
};

export const getLanguages = async () => {
	const languages = (await import(`./locales/languages.json`)).default;
	return languages;
};
export const changeLanguage = (lang: string) => {
	document.documentElement.setAttribute('lang', lang);
	i18next.changeLanguage(lang);
};
