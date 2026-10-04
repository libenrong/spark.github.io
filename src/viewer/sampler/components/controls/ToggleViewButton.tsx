import { faEye } from '@fortawesome/free-solid-svg-icons';
import { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import FaButton from '../../../../components/FaButton';
import { SamplerMetadata } from '../../../proto/spark_pb';
import { View, VIEW_ALL, VIEW_FLAT, VIEW_SOURCES } from '../views/types';

export interface ToggleViewButtonProps {
    metadata: SamplerMetadata;
    view: View;
    setView: Dispatch<SetStateAction<View>>;
    sourcesViewSupported: boolean;
}

export default function ToggleViewButton({
    metadata,
    view,
    setView,
    sourcesViewSupported,
}: ToggleViewButtonProps) {
    const { t } = useTranslation('sampler');

    const supportedViews: View[] = [
        VIEW_ALL,
        VIEW_FLAT,
        ...(sourcesViewSupported ? [VIEW_SOURCES] : []),
    ];

    return (
        <>
            {supportedViews.map(v => {
                function onClick() {
                    setView(v);
                }

                let id;
                if (v === VIEW_ALL) {
                    id = 'all';
                } else if (v === VIEW_FLAT) {
                    id = 'flat';
                } else {
                    id = ['Fabric', 'Forge', 'NeoForge'].includes(
                        metadata?.platform?.name || ''
                    )
                        ? 'mods'
                        : 'plugins';
                }

                return (
                    <FaButton
                        key={id}
                        icon={faEye}
                        onClick={onClick}
                        title={t('controls.toggleView')}
                        extraClassName={
                            view === v
                                ? 'sources-view-button toggled'
                                : 'sources-view-button'
                        }
                    >
                        <span>{t(`views.${id}`)}</span>
                    </FaButton>
                );
            })}
        </>
    );
}
