import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import enHealth from './locales/en/health.json';
import enHeap from './locales/en/heap.json';
import enMetadata from './locales/en/metadata.json';
import enMetrics from './locales/en/metrics.json';
import enPages from './locales/en/pages.json';
import enSampler from './locales/en/sampler.json';
import enWidgets from './locales/en/widgets.json';
import zhCommon from './locales/zh-CN/common.json';
import zhHealth from './locales/zh-CN/health.json';
import zhHeap from './locales/zh-CN/heap.json';
import zhMetadata from './locales/zh-CN/metadata.json';
import zhMetrics from './locales/zh-CN/metrics.json';
import zhPages from './locales/zh-CN/pages.json';
import zhSampler from './locales/zh-CN/sampler.json';
import zhWidgets from './locales/zh-CN/widgets.json';

export const NAMESPACES = [
    'common',
    'pages',
    'metadata',
    'widgets',
    'metrics',
    'sampler',
    'heap',
    'health',
] as const;

export const LOCALES = ['en', 'zh-CN'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_NAMES: Record<Locale, string> = {
    'en': 'English',
    'zh-CN': '简体中文',
};

const STORAGE_KEY = 'spark.locale';

const resources = {
    'en': {
        common: enCommon,
        pages: enPages,
        metadata: enMetadata,
        widgets: enWidgets,
        metrics: enMetrics,
        sampler: enSampler,
        heap: enHeap,
        health: enHealth,
    },
    'zh-CN': {
        common: zhCommon,
        pages: zhPages,
        metadata: zhMetadata,
        widgets: zhWidgets,
        metrics: zhMetrics,
        sampler: zhSampler,
        heap: zhHeap,
        health: zhHealth,
    },
};

function detectLocale(): Locale {
    if (typeof window === 'undefined') {
        return 'en';
    }
    try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved === 'en' || saved === 'zh-CN') {
            return saved;
        }
    } catch {
        // ignore
    }
    const nav = window.navigator.language || '';
    return nav.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
}

function applyLocale(locale: Locale) {
    if (typeof document !== 'undefined') {
        document.documentElement.lang = locale;
    }
    dayjs.locale(locale === 'zh-CN' ? 'zh-cn' : 'en');
}

void i18n.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: [...NAMESPACES],
    interpolation: { escapeValue: false },
    returnNull: false,
    react: { useSuspense: false },
});

applyLocale('en');

/** Called once on the client after mount to apply the persisted/detected locale. */
export function initClientLocale() {
    const locale = detectLocale();
    applyLocale(locale);
    if (locale !== i18n.language) {
        void i18n.changeLanguage(locale);
    }
}

export function getLocale(): Locale {
    return i18n.language === 'zh-CN' ? 'zh-CN' : 'en';
}

export function setLocale(locale: Locale) {
    if (typeof window !== 'undefined') {
        try {
            window.localStorage.setItem(STORAGE_KEY, locale);
        } catch {
            // ignore
        }
    }
    applyLocale(locale);
    void i18n.changeLanguage(locale);
}

export default i18n;
