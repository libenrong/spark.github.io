import { useTranslation } from 'react-i18next';
import { WorldStatistics as WorldStatisticsProto } from '../../../../proto/spark_pb';
import EntityCountsList from './EntityCountsList';
import WorldTotalChunks from './WorldTotalChunks';
import WorldTotalEntities from './WorldTotalEntities';

export interface WorldSummaryProps {
    worldStatistics: WorldStatisticsProto;
}

export default function WorldSummary({ worldStatistics }: WorldSummaryProps) {
    const { t } = useTranslation('metadata');
    return (
        <div>
            <div className="header">{t('world.summary')}</div>
            <div className="detail-lists">
                <div>
                    <WorldTotalEntities
                        totalEntities={worldStatistics.totalEntities}
                        worlds={worldStatistics.worlds}
                    />
                    <WorldTotalChunks worldsInput={worldStatistics.worlds} />
                </div>
                <div>
                    <p>
                        <b>{t('world.entityCounts')}</b>
                        {t('punctuation.colon')}
                    </p>
                    <EntityCountsList
                        entityCounts={worldStatistics.entityCounts}
                    />
                </div>
            </div>
        </div>
    );
}
