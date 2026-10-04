import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../pages/_app';
import styles from '../style/header.module.scss';

export default function ThemeToggle() {
    const { t } = useTranslation('common');
    const [theme, setTheme] = useContext(ThemeContext);
    const themeName = t(
        theme === 'dark' ? 'theme.darkMode' : 'theme.lightMode'
    );
    return (
        <button
            className={styles['theme-toggle']}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={themeName}
            aria-label={t('theme.toggle', { theme: themeName })}
        >
            <FontAwesomeIcon icon={theme === 'dark' ? faMoon : faSun} />
        </button>
    );
}
