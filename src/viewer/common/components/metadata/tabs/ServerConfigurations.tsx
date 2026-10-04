import { useTranslation } from 'react-i18next';
import ConfigurationObject from './ConfigurationObject';

export interface ServerConfigurationsProps {
    parsedConfigurations: Record<string, any>;
}

export default function ServerConfigurations({
    parsedConfigurations,
}: ServerConfigurationsProps) {
    const { t } = useTranslation('metadata');
    return (
        <div className="configurations">
            <p>{t('configurations.intro')}</p>
            <ConfigurationObject data={parsedConfigurations} />
        </div>
    );
}
