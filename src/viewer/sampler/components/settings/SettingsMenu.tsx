import { faSliders } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TextBox from '../../../../components/TextBox';

import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../../../../style/sampler.module.scss';
import Switch from '../../../common/components/Switch';
import { MappingsMetadata } from '../../mappings/fetch';
import MappingsSelector from './MappingsSelector';

export interface SettingsMenuProps {
    mappingsMetadata?: MappingsMetadata;
    mappings: string;
    setMappings: (type: string) => void;
    infoPoints: boolean;
    toggleInfoPoints: () => void;
}

export default function SettingsMenu({
    mappingsMetadata,
    mappings,
    setMappings,
    infoPoints,
    toggleInfoPoints,
}: SettingsMenuProps) {
    const { t } = useTranslation('sampler');

    return (
        <TextBox extraClassName={styles['settings-menu']}>
            {mappingsMetadata && (
                <Setting
                    name={t('settings.mappings.name')}
                    desc={t('settings.mappings.desc')}
                >
                    <MappingsSelector
                        mappingsMetadata={mappingsMetadata}
                        mappings={mappings}
                        setMappings={setMappings}
                    />
                </Setting>
            )}
            <Setting
                name={t('settings.infoPoints.name')}
                desc={t('settings.infoPoints.desc')}
            >
                <Switch value={infoPoints} toggle={toggleInfoPoints} />
            </Setting>
        </TextBox>
    );
}

interface SettingProps {
    name: string;
    desc: string;
    children: ReactNode;
}

const Setting = ({ name, desc, children }: SettingProps) => {
    const { t } = useTranslation('sampler');

    return (
        <div className="setting">
            <div className="setting-control">
                <FontAwesomeIcon icon={faSliders} />{' '}
                <span>{t('settings.nameLabel', { name })}</span> {children}
            </div>
            <p>{desc}</p>
        </div>
    );
};
