import { faSliders } from '@fortawesome/free-solid-svg-icons';
import { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import FaButton from '../../../../components/FaButton';

export interface SettingsButtonProps {
    showSettings: boolean;
    setShowSettings: Dispatch<SetStateAction<boolean>>;
}

export default function SettingsButton({
    showSettings,
    setShowSettings,
}: SettingsButtonProps) {
    const { t } = useTranslation('sampler');

    function onClick() {
        setShowSettings(state => !state);
    }

    return (
        <FaButton
            icon={faSliders}
            onClick={onClick}
            title={t('controls.settings')}
            extraClassName={showSettings ? 'toggled' : undefined}
        />
    );
}
