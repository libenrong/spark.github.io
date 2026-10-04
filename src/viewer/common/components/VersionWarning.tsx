import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import TextBox from '../../../components/TextBox';

import styles from '../../../style/sampler.module.scss';

export default function VersionWarning() {
    const { t } = useTranslation('common');
    const [show, setShow] = useState(true);

    if (!show) {
        return null;
    }

    function onClick() {
        setShow(false);
    }

    const warning = (
        <span role="img" aria-label={t('viewer.warning')}>
            ⚠️
        </span>
    );
    return (
        <TextBox extraClassName={styles['version-warning']}>
            {warning}
            <b>{t('viewer.versionWarningTitle')}</b>
            {warning}
            <FontAwesomeIcon icon={faTimes} onClick={onClick} />
            <br />
            {t('viewer.versionWarningBody')}
        </TextBox>
    );
}
