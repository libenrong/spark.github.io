import { useTranslation } from 'react-i18next';
import { convertSeries, Metric, MetricProps } from '../Metric';
import MetricGraph from '../MetricGraph';

const intFormat = (value: number) => value.toFixed(0);

export default function PlayerPingMetric({ metrics, timeRange }: MetricProps) {
    const { t } = useTranslation('metrics');
    const meanData = convertSeries(metrics.playerPing, v => v.mean, timeRange);
    const medianData = convertSeries(
        metrics.playerPing,
        v => v.median,
        timeRange
    );
    const minData = convertSeries(metrics.playerPing, v => v.min, timeRange);

    if (!meanData || !medianData || !minData) return null;

    return (
        <Metric title={t('title.playerPing')}>
            <MetricGraph
                series={[
                    {
                        name: t('series.mean'),
                        data: meanData,
                        color: '#ffdc50',
                    },
                    {
                        name: t('series.median'),
                        data: medianData,
                        color: '#E271D5',
                    },
                    { name: t('series.min'), data: minData, color: '#4E9BE6' },
                ]}
                format={intFormat}
            />
        </Metric>
    );
}
