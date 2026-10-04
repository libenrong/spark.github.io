import { useTranslation } from 'react-i18next';
import { formatBytesShort } from '../../../util/format';
import { convertSeries, Metric, MetricProps } from '../Metric';
import MetricGraph from '../MetricGraph';

const memoryFormat = (value: number) => formatBytesShort(value, 0);

export default function MemoryMetric({ metrics, timeRange }: MetricProps) {
    const { t } = useTranslation('metrics');
    const usedData = convertSeries(
        metrics.memoryUsageHeap,
        v => v.used,
        timeRange
    );
    const maxData = convertSeries(
        metrics.memoryUsageHeap,
        v => v.max,
        timeRange
    );
    const committedData = convertSeries(
        metrics.memoryUsageHeap,
        v => v.committed,
        timeRange
    );

    if (!usedData || !maxData || !committedData) return null;

    return (
        <Metric title={t('title.memory')} label={t('label.heap')}>
            <MetricGraph
                series={[
                    {
                        name: t('series.used'),
                        data: usedData,
                        color: '#fc704f',
                    },
                    { name: t('series.max'), data: maxData, color: '#C94F3D' },
                    {
                        name: t('series.committed'),
                        data: committedData,
                        color: '#F9A58F',
                    },
                ]}
                format={memoryFormat}
            />
        </Metric>
    );
}
