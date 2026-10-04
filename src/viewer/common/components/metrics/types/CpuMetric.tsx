import { useTranslation } from 'react-i18next';
import { convertSeries, Metric, MetricProps } from '../Metric';
import MetricGraph from '../MetricGraph';

const percentFormat = (value: number) => `${(value * 100).toFixed(1)}%`;

export default function CpuMetric({ metrics, timeRange }: MetricProps) {
    const { t } = useTranslation('metrics');
    const processData = convertSeries(
        metrics.cpuUsageProcess,
        v => v,
        timeRange
    );
    const systemData = convertSeries(metrics.cpuUsageSystem, v => v, timeRange);

    if (!processData || !systemData) return null;

    return (
        <Metric title={t('title.cpu')}>
            <MetricGraph
                series={[
                    {
                        name: t('series.process'),
                        data: processData,
                        color: '#719DE2',
                    },
                    {
                        name: t('series.system'),
                        data: systemData,
                        color: '#F7AD48',
                    },
                ]}
                format={percentFormat}
            />
        </Metric>
    );
}
