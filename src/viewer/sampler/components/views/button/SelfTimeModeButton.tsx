import { Dispatch, SetStateAction, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { SamplerMetadata_SamplerMode } from '../../../../proto/spark_pb';
import { MetadataContext } from '../../SamplerContext';
import Button from './Button';

export interface SelfTimeModeButtonProps {
    selfTimeMode: boolean;
    setSelfTimeMode: Dispatch<SetStateAction<boolean>>;
}

export default function SelfTimeModeButton({
    selfTimeMode,
    setSelfTimeMode,
}: SelfTimeModeButtonProps) {
    const { t } = useTranslation('sampler');
    const metadata = useContext(MetadataContext)!;

    if (metadata.samplerMode === SamplerMetadata_SamplerMode.ALLOCATION) {
        return (
            <Button
                value={selfTimeMode}
                setValue={setSelfTimeMode}
                title={t('buttons.sortMode.title')}
                labelTrue={t('buttons.sortMode.selfBytes')}
                labelFalse={t('buttons.sortMode.totalBytes')}
            >
                <p>{t('buttons.sortMode.selfBytesDesc')}</p>
                <p>{t('buttons.sortMode.totalBytesDesc')}</p>
            </Button>
        );
    } else {
        return (
            <Button
                value={selfTimeMode}
                setValue={setSelfTimeMode}
                title={t('buttons.sortMode.title')}
                labelTrue={t('buttons.sortMode.selfTime')}
                labelFalse={t('buttons.sortMode.totalTime')}
            >
                <p>{t('buttons.sortMode.selfTimeDesc')}</p>
                <p>{t('buttons.sortMode.totalTimeDesc')}</p>
            </Button>
        );
    }
}
