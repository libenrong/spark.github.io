import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import styles from '../../../../style/widgets.module.scss';
import { SparkMetadata } from '../../../proto/guards';
import CpuWidget from './types/CpuWidget';
import DiskWidget from './types/DiskWidget';
import GcWidget from './types/GcWidget';
import MemoryWidget from './types/MemoryWidget';
import MsptWidget from './types/MsptWidget';
import PingWidget from './types/PingWidget';
import TpsWidget from './types/TpsWidget';

export interface WidgetsProps {
    metadata: SparkMetadata;
    expanded: boolean;
}

export default function Widgets({ metadata, expanded }: WidgetsProps) {
    const { t } = useTranslation('widgets');
    const platform = metadata.platformStatistics!;
    const system = metadata.systemStatistics!;

    return (
        <div
            className={classNames(styles.widgets, 'widgets')}
            data-hide={!expanded}
        >
            {platform.tps && <TpsWidget tps={platform.tps} />}
            {platform.mspt && <MsptWidget mspt={platform.mspt} />}
            <CpuWidget
                cpu={system.cpu!.processUsage!}
                label={t('scope.process')}
            />
            <MemoryWidget
                memory={platform.memory!.heap!}
                label={t('scope.process')}
            />
            <CpuWidget
                cpu={system.cpu!.systemUsage!}
                label={t('scope.system')}
            />
            <MemoryWidget
                memory={system.memory!.physical!}
                label={t('scope.physical')}
            />
            <MemoryWidget
                memory={system.memory!.swap!}
                label={t('scope.swap')}
            />
            <DiskWidget disk={system.disk!} />
            {platform.ping && <PingWidget ping={platform.ping} />}
            {Object.entries(platform.gc).map(([label, data]) => {
                return (
                    <GcWidget
                        gc={data}
                        title={t('scope.during')}
                        label={label}
                        key={label}
                    />
                );
            })}
            {Object.entries(system.gc).map(([label, data]) => {
                return (
                    <GcWidget
                        gc={data}
                        title={t('scope.all')}
                        label={label}
                        key={'system ' + label}
                    />
                );
            })}
        </div>
    );
}
