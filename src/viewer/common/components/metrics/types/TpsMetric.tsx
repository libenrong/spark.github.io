import { useTranslation } from 'react-i18next';
import { convertSeries, Metric, MetricProps } from '../Metric';
import MetricGraph from '../MetricGraph';

const doubleFormat = (value: number) => value.toFixed(2);

export default function TpsMetric({ metrics, timeRange }: MetricProps) {
    const { t } = useTranslation('metrics');
    const tpsData = convertSeries(metrics.tps, v => v, timeRange);

    if (!tpsData) return null;

    return (
        <Metric title={t('title.tps')}>
            <MetricGraph
                series={[
                    {
                        name: t('series.tps'),
                        data: tpsData,
                        color: '#71E27D',
                    },
                ]}
                format={doubleFormat}
            />
        </Metric>
    );
}
