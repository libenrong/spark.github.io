import { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import Button from './Button';

export interface MergeModeButtonProps {
    merged: boolean;
    setMerged: Dispatch<SetStateAction<boolean>>;
}

export default function MergeModeButton({
    merged,
    setMerged,
}: MergeModeButtonProps) {
    const { t } = useTranslation('sampler');

    return (
        <Button
            value={merged}
            setValue={setMerged}
            title={t('buttons.mergeMode.title')}
            labelTrue={t('buttons.mergeMode.merge')}
            labelFalse={t('buttons.mergeMode.separate')}
        >
            <p>{t('buttons.mergeMode.mergeDesc')}</p>
            <p>{t('buttons.mergeMode.separateDesc')}</p>
        </Button>
    );
}
