import { faWarning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import TextBox from '../../../../components/TextBox';

import styles from '../../../../style/sampler.module.scss';

export interface NoDataProps {
    isConnectedToSocket: boolean;
}

export default function NoData({ isConnectedToSocket }: NoDataProps) {
    const { t } = useTranslation('sampler');

    return (
        <TextBox extraClassName={styles['no-data']}>
            <h2>
                <FontAwesomeIcon icon={faWarning} /> <b>{t('noData.title')}</b>
            </h2>
            <p>
                {isConnectedToSocket ? t('noData.pending') : t('noData.empty')}
            </p>
        </TextBox>
    );
}
