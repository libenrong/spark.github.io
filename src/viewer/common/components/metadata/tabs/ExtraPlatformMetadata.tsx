import { useTranslation } from 'react-i18next';
import ConfigurationObject from './ConfigurationObject';

export interface ExtraPlatformMetadataProps {
    data: Record<string, any>;
}

export default function ExtraPlatformMetadata({
    data,
}: ExtraPlatformMetadataProps) {
    const { t } = useTranslation('metadata');
    return (
        <div className="configurations">
            <p>{t('extraMetadata.intro')}</p>
            <ConfigurationObject data={data} />
        </div>
    );
}
