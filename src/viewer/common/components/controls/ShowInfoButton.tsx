import {
    faChartLine,
    faGauge,
    faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import FaButton from '../../../../components/FaButton';
import { SparkMetadata } from '../../../proto/guards';
import { MetadataToggle } from '../../hooks/useMetadataToggle';

export interface ShowInfoButtonProps {
    metadata: SparkMetadata;
    metadataToggle: MetadataToggle;
}

export default function ShowInfoButton({
    metadata,
    metadataToggle,
}: ShowInfoButtonProps) {
    const { t } = useTranslation('common');
    if (!metadata.platform) {
        return null;
    }

    return (
        <>
            <FaButton
                icon={faGauge}
                onClick={metadataToggle.toggleWidgets}
                title={t('viewer.controls.toggleWidgets')}
                extraClassName={
                    metadataToggle.showWidgets ? 'toggled' : undefined
                }
            />
            <FaButton
                icon={faInfoCircle}
                onClick={metadataToggle.toggleInfo}
                title={t('viewer.controls.toggleMetadata')}
                extraClassName={metadataToggle.showInfo ? 'toggled' : undefined}
            />
            {!!metadata.metrics && (
                <FaButton
                    icon={faChartLine}
                    onClick={metadataToggle.toggleMetrics}
                    title={t('viewer.controls.toggleMetrics')}
                    extraClassName={
                        metadataToggle.showMetrics ? 'toggled' : undefined
                    }
                />
            )}
        </>
    );
}
