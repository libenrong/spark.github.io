import { faRuler } from '@fortawesome/free-solid-svg-icons';
import { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import FaButton from '../../../../components/FaButton';

export interface RefineGraphButtonProps {
    refineGraphSupported: boolean;
    showRefineGraph: boolean;
    setShowRefineGraph: Dispatch<SetStateAction<boolean>>;
}

export default function RefineGraphButton({
    refineGraphSupported,
    showRefineGraph,
    setShowRefineGraph,
}: RefineGraphButtonProps) {
    const { t } = useTranslation('sampler');

    if (!refineGraphSupported) {
        return null;
    }

    function onClick() {
        setShowRefineGraph(state => !state);
    }

    return (
        <FaButton
            icon={faRuler}
            onClick={onClick}
            title={t('controls.refine')}
            extraClassName={showRefineGraph ? 'toggled' : undefined}
        />
    );
}
