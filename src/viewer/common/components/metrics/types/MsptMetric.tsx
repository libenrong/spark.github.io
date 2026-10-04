import { useTranslation } from 'react-i18next';
import { convertSeries, Metric, MetricProps } from '../Metric';
import MetricGraph from '../MetricGraph';

const doubleFormat = (value: number) => value.toFixed(2);

export default function MsptMetric({ metrics, timeRange }: MetricProps) {
    const { t } = useTranslation('metrics');
    const percentile95Data = convertSeries(
        metrics.tickDuration,
        v => v.percentile95,
        timeRange
    );
    const minData = convertSeries(metrics.tickDuration, v => v.min, timeRange);
    const maxData = convertSeries(metrics.tickDuration, v => v.max, timeRange);

    if (!percentile95Data || !minData || !maxData) return null;

    return (
        <Metric title={t('title.mspt')}>
            <MetricGraph
                series={[
                    {
                        name: t('series.pct95'),
                        data: percentile95Data,
                        color: '#E271D5',
                    },
                    { name: t('series.min'), data: minData, color: '#4E9BE6' },
                    { name: t('series.max'), data: maxData, color: '#E85D75' },
                ]}
                format={doubleFormat}
            />
        </Metric>
    );
}
