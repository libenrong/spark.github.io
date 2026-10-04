import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import FaButton from '../../../../components/FaButton';
import VirtualNode from '../../node/VirtualNode';

export interface ExitFlameButtonProps {
    setFlameData: Dispatch<SetStateAction<VirtualNode | undefined>>;
}

export default function ExitFlameButton({
    setFlameData,
}: ExitFlameButtonProps) {
    const { t } = useTranslation('sampler');

    function onClick() {
        setFlameData(undefined);
    }

    return (
        <FaButton
            icon={faTimes}
            onClick={onClick}
            title={t('controls.exitFlame')}
        />
    );
}
