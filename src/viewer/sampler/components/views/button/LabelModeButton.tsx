import { Dispatch, SetStateAction, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { SamplerMetadata_SamplerMode } from '../../../../proto/spark_pb';
import { MetadataContext } from '../../SamplerContext';
import Button from './Button';

export interface LabelModeButtonProps {
    labelMode: boolean;
    setLabelMode: Dispatch<SetStateAction<boolean>>;
}

export default function LabelModeButton({
    labelMode,
    setLabelMode,
}: LabelModeButtonProps) {
    const { t } = useTranslation('sampler');
    const metadata = useContext(MetadataContext)!;
    const isAllocationProfile =
        metadata.samplerMode === SamplerMetadata_SamplerMode.ALLOCATION;

    if (!isAllocationProfile && !metadata.numberOfTicks) {
        return null;
    }

    if (isAllocationProfile) {
        return (
            <Button
                value={labelMode}
                setValue={setLabelMode}
                title={t('buttons.labelMode.title')}
                labelTrue={t('buttons.labelMode.bytesPerSecond')}
                labelFalse={t('buttons.labelMode.percentage')}
            >
                <p>{t('buttons.labelMode.bytesPerSecondDesc')}</p>
                <p>{t('buttons.labelMode.percentageBytesDesc')}</p>
            </Button>
        );
    } else {
        return (
            <Button
                value={labelMode}
                setValue={setLabelMode}
                title={t('buttons.labelMode.title')}
                labelTrue={t('buttons.labelMode.timePerTick')}
                labelFalse={t('buttons.labelMode.percentage')}
            >
                <p>{t('buttons.labelMode.timePerTickDesc')}</p>
                <p>{t('buttons.labelMode.percentageTimeDesc')}</p>
            </Button>
        );
    }
}
