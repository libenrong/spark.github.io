import { useTranslation } from 'react-i18next';
import {
    MemoryUsage,
    PlatformStatistics_Gc,
    PlatformStatistics_Memory,
} from '../../../../proto/spark_pb';
import { formatBytes } from '../../../util/format';
import { WidgetFormat } from '../../widgets/format';

export interface MemoryStatisticsProps {
    memory: PlatformStatistics_Memory;
    gc: Record<string, PlatformStatistics_Gc>;
}

export default function MemoryStatistics({
    memory,
    gc,
}: MemoryStatisticsProps) {
    const { t } = useTranslation('metadata');
    return (
        <>
            <div className="memory">
                {memory.heap && (
                    <MemoryPool name={t('memory.heap')} usage={memory.heap} />
                )}
                {memory.nonHeap && (
                    <MemoryPool
                        name={t('memory.nonHeap')}
                        usage={memory.nonHeap}
                    />
                )}
                {(memory.pools || [])
                    .filter(pool => pool.usage)
                    .map(pool => {
                        return (
                            <MemoryPool
                                key={pool.name}
                                name={t('memory.pool', { name: pool.name })}
                                usage={pool.usage!}
                                collectionUsage={pool.collectionUsage}
                            />
                        );
                    })}
            </div>
        </>
    );
}

interface MemoryPoolProps {
    name: string;
    usage: MemoryUsage;
    collectionUsage?: MemoryUsage;
}

const MemoryPool = ({ name, usage, collectionUsage }: MemoryPoolProps) => {
    const { t } = useTranslation('metadata');
    return (
        <div className="memory-pool">
            <div className="header">{name}</div>
            <MemoryUsageBar {...usage} />
            {collectionUsage && (
                <div>
                    <br />
                    <div className="header">
                        {t('memory.atLastGC', { name })}
                    </div>
                    <MemoryUsageBar {...collectionUsage} />
                </div>
            )}
        </div>
    );
};

const MemoryUsageBar = ({ used, committed, max }: MemoryUsage) => {
    const { t } = useTranslation('metadata');
    let percent;
    if (max && max > 0) {
        percent = used / max;
    } else {
        percent = used / committed;
    }

    let color;
    if (percent > 0.9) {
        color = WidgetFormat.colors.red;
    } else if (percent > 0.65) {
        color = WidgetFormat.colors.yellow;
    } else {
        color = WidgetFormat.colors.green;
    }

    return (
        <>
            <div className="usage-bar">
                <div
                    style={{
                        width: `${Math.ceil(percent * 100)}%`,
                        backgroundColor: color,
                    }}
                />
            </div>
            <ul>
                <li>
                    {t('memory.used')} <span>{formatBytes(used)}</span>
                </li>
                <li>
                    {t('memory.committed')}{' '}
                    <span>{formatBytes(committed)}</span>
                </li>
                {max !== -1 && max !== committed && (
                    <li>
                        {t('memory.max')} <span>{formatBytes(max)}</span>
                    </li>
                )}
            </ul>
        </>
    );
};
