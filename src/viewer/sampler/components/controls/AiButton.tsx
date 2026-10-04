import { faRobot } from '@fortawesome/free-solid-svg-icons';
import { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import FaButton from '../../../../components/FaButton';

export interface AiButtonProps {
    showAi: boolean;
    setShowAi: Dispatch<SetStateAction<boolean>>;
}

export default function AiButton({ showAi, setShowAi }: AiButtonProps) {
    const { t } = useTranslation('sampler');

    function onClick() {
        setShowAi(state => !state);
    }

    return (
        <FaButton
            icon={faRobot}
            onClick={onClick}
            title={t('controls.ai')}
            extraClassName={showAi ? 'toggled' : undefined}
        />
    );
}
