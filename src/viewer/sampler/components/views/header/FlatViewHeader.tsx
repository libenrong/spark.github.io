import { faEye } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import { HeaderProps } from './types';

export default function FlatViewHeader({ children }: HeaderProps) {
    const { t } = useTranslation('sampler');

    return (
        <div className="header">
            <h2>
                <FontAwesomeIcon icon={faEye} /> {t('headers.flat.title')}
            </h2>
            <p>{t('headers.flat.desc')}</p>
            {children}
        </div>
    );
}
