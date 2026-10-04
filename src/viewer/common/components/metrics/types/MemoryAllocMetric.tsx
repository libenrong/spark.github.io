import { useTranslation } from 'react-i18next';
import { formatBytesShort } from '../../../util/format';
import { convertSeries, Metric, MetricProps } from '../Metric';
import MetricGraph from '../MetricGraph';

const bytesPerSecondFormat = (value: number) =>
    `${formatBytesShort(value, 0)}/s`;

export default function MemoryAllocMetric({ metrics, timeRange }: MetricProps) {
    const { t } = useTranslation('metrics');
    const data = convertSeries(metrics.memoryAllocation, v => v, timeRange);

    if (!data) return null;

    return (
        <Metric title={t('title.memory')} label={t('label.alloc')}>
            <MetricGraph
                series={[
                    {
                        name: t('series.bytesPerSec'),
                        data: data,
                        color: '#fc704f',
                    },
                ]}
                format={bytesPerSecondFormat}
            />
        </Metric>
    );
}
