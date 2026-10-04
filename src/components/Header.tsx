import Link from 'next/link';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import SparkLogoInverted from '../assets/spark-logo-inverted.svg';
import SparkLogo from '../assets/spark-logo.svg';
import { ThemeContext } from '../pages/_app';
import styles from '../style/header.module.scss';
import LanguageToggle from './LanguageToggle';
import ThemeToggle from './ThemeToggle';

export interface HeaderProps {
    title?: string;
}

export default function Header({ title }: HeaderProps) {
    const { t } = useTranslation('common');
    const [theme] = useContext(ThemeContext);
    const Logo = theme === 'dark' ? SparkLogo : SparkLogoInverted;

    return (
        <header className={styles.header}>
            <Link href="/" className="logo">
                <Logo width="2.5em" height="2.5em" />
                <h1>{title ?? t('header.defaultTitle')}</h1>
            </Link>
            <LanguageToggle />
            <ThemeToggle />
        </header>
    );
}

export function HomepageHeader() {
    const { t } = useTranslation('common');
    const [theme] = useContext(ThemeContext);
    const Logo = theme === 'dark' ? SparkLogo : SparkLogoInverted;

    return (
        <div className={styles['homepage-header']}>
            <div>
                <Logo />
                <div>
                    <h1>spark</h1>
                    <div>{t('header.tagline')}</div>
                </div>
            </div>
            <div className={styles['homepage-header-controls']}>
                <LanguageToggle />
                <ThemeToggle />
            </div>
        </div>
    );
}
