import { useTranslation } from 'react-i18next';
import { SystemStatistics as SystemStatisticsProto } from '../../../../proto/spark_pb';

export interface JvmStartupArgsProps {
    systemStatistics: SystemStatisticsProto;
}

export default function JvmStartupArgs({
    systemStatistics,
}: JvmStartupArgsProps) {
    const { t } = useTranslation('metadata');
    return (
        <p>
            {t('jvmArgs.intro')}
            <br />
            <br />
            <span
                style={{
                    maxWidth: '1000px',
                    display: 'inline-block',
                    color: 'inherit',
                }}
            >
                {systemStatistics.java!.vmArgs}
            </span>
        </p>
    );
}
