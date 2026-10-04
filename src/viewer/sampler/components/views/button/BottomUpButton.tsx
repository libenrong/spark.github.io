import { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import Button from './Button';

export interface BottomUpButtonProps {
    bottomUp: boolean;
    setBottomUp: Dispatch<SetStateAction<boolean>>;
}

export default function BottomUpButton({
    bottomUp,
    setBottomUp,
}: BottomUpButtonProps) {
    const { t } = useTranslation('sampler');

    return (
        <Button
            value={bottomUp}
            setValue={setBottomUp}
            title={t('buttons.display.title')}
            labelTrue={t('buttons.display.bottomUp')}
            labelFalse={t('buttons.display.topDown')}
        >
            <p>{t('buttons.display.bottomUpDesc')}</p>
            <p>{t('buttons.display.topDownDesc')}</p>
        </Button>
    );
}
