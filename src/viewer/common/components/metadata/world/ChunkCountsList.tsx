import { useTranslation } from 'react-i18next';
import { Tooltip } from 'react-tooltip';
import { WorldStatistics_Chunk } from '../../../../proto/spark_pb';

export interface ChunkCountsListProps {
    chunks: WorldStatistics_Chunk[];
}

export default function ChunkCountsList({ chunks }: ChunkCountsListProps) {
    const { t } = useTranslation('metadata');
    const chunksToDisplay = chunks.slice(0, 10);
    const more = chunks.length - 10;

    return (
        <>
            <ul>
                {chunksToDisplay.map(chunk => (
                    <li key={`${chunk.x},${chunk.z}`}>
                        <span
                            data-tooltip-id="chunk-tp-tooltip"
                            data-tooltip-content={`/tp ${chunk.x * 16} ~ ${chunk.z * 16}`}
                        >
                            {chunk.x}, {chunk.z}
                        </span>{' '}
                        {t('world.chunkEntity', { count: chunk.totalEntities })}
                    </li>
                ))}
                {more > 0 && (
                    <li style={{ listStyleType: 'none' }}>
                        {t('world.more', { n: more })}
                    </li>
                )}
            </ul>
            <Tooltip id="chunk-tp-tooltip" place="left" clickable />
        </>
    );
}
