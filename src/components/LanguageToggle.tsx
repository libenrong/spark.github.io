import { useTranslation } from 'react-i18next';
import { LOCALE_NAMES, Locale, setLocale } from '../i18n';
import styles from '../style/header.module.scss';

export default function LanguageToggle() {
    const { t, i18n } = useTranslation('common');
    const current: Locale = i18n.language === 'zh-CN' ? 'zh-CN' : 'en';
    const next: Locale = current === 'en' ? 'zh-CN' : 'en';

    return (
        <button
            className={styles['theme-toggle']}
            onClick={() => setLocale(next)}
            title={t('language.toggle', { current: LOCALE_NAMES[current] })}
            aria-label={t('language.toggle', {
                current: LOCALE_NAMES[current],
            })}
        >
            {current === 'en' ? '中' : 'EN'}
        </button>
    );
}
