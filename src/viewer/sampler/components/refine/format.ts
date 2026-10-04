import i18n from '../../../../i18n';
import { WindowStatisticsKey } from './util';

export function getAxisLabel(statisticName: WindowStatisticsKey) {
    return i18n.t(`sampler:refine.axis.${statisticName}`);
}

export function getColor(statisticName: WindowStatisticsKey) {
    return {
        tps: '#71E27D',
        msptMedian: '#E271D5',
        cpuProcess: '#719DE2',
        cpuSystem: '#F7AD48',
        players: '#b72c7d',
        entities: '#fc704f',
        tileEntities: '#addcff',
        chunks: '#a1a1a1',
    }[statisticName];
}
