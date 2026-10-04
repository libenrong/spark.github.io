import { faEye } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { MetadataContext } from '../../SamplerContext';
import { HeaderProps } from './types';

export default function SourcesViewHeader({ children }: HeaderProps) {
    const { t } = useTranslation('sampler');
    const metadata = useContext(MetadataContext)!;
    const isMod = ['Fabric', 'Forge', 'NeoForge'].includes(
        metadata.platform?.name!
    );

    return (
        <div className="header">
            <h2>
                <FontAwesomeIcon icon={faEye} />{' '}
                {t('headers.sources.title', {
                    noun: t(isMod ? 'noun.mods' : 'noun.plugins'),
                })}
            </h2>
            <p>
                {t('headers.sources.desc', {
                    noun: t(isMod ? 'noun.mod' : 'noun.plugin'),
                })}
            </p>
            {children}
        </div>
    );
}
