import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import styles from '../../../../../style/widgets.module.scss';
import {
    RollingAverageValues,
    SystemStatistics as SystemStatisticsProto,
    SystemStatistics_NetInterface,
} from '../../../../proto/spark_pb';
import { formatBytes, formatNumber } from '../../../util/format';
import { Formatter, WidgetFormat } from '../../widgets/format';
import Widget from '../../widgets/Widget';
import WidgetValue from '../../widgets/WidgetValue';

export interface NetworkStatisticsProps {
    systemStatistics: SystemStatisticsProto;
}

export default function NetworkStatistics({
    systemStatistics,
}: NetworkStatisticsProps) {
    const { t } = useTranslation('metadata');
    return (
        <>
            <p>{t('network.note')}</p>
            <div>
                {Object.entries(systemStatistics.net).map(([name, data]) => (
                    <NetworkInterface key={name} name={name} data={data} />
                ))}
            </div>
        </>
    );
}

const NetworkInterface = ({
    name,
    data,
}: {
    name: string;
    data: SystemStatistics_NetInterface;
}) => {
    const { t } = useTranslation('metadata');
    return (
        <div>
            <h3>{name}</h3>
            <div
                className={classNames(
                    styles.widgets,
                    'widgets',
                    'net-interface-widgets'
                )}
            >
                <NetworkInterfaceWidget
                    direction={t('network.transmit')}
                    directionId="transmit"
                    format={t('network.bytesPerSec')}
                    values={data.txBytesPerSecond!}
                />
                <NetworkInterfaceWidget
                    direction={t('network.receive')}
                    directionId="receive"
                    format={t('network.bytesPerSec')}
                    values={data.rxBytesPerSecond!}
                />
            </div>
            <div
                className={classNames(
                    styles.widgets,
                    'widgets',
                    'net-interface-widgets'
                )}
            >
                <NetworkInterfaceWidget
                    direction={t('network.transmit')}
                    directionId="transmit"
                    format={t('network.packetsPerSec')}
                    values={data.txPacketsPerSecond!}
                />
                <NetworkInterfaceWidget
                    direction={t('network.receive')}
                    directionId="receive"
                    format={t('network.packetsPerSec')}
                    values={data.rxPacketsPerSecond!}
                />
            </div>
        </div>
    );
};

interface NetworkInterfaceWidgetProps {
    direction: string;
    directionId: string;
    format: string;
    values: RollingAverageValues;
}

const NetworkInterfaceWidget = ({
    direction,
    directionId,
    format,
    values,
}: NetworkInterfaceWidgetProps) => {
    const { t } = useTranslation('metadata');
    const isBytes = format === t('network.bytesPerSec');
    const formatter: Formatter = {
        color: value => {
            if (value <= 0) {
                return WidgetFormat.colors.yellow;
            }
            // TODO: set some sensible thresholds here for bytes/packets per second
            return WidgetFormat.colors.green;
        },
        format: value => {
            if (isBytes) {
                return formatBytes(value);
            } else {
                return formatNumber(value);
            }
        },
    };

    return (
        <Widget
            id={directionId}
            title={direction}
            label={format}
            formatter={formatter}
        >
            <WidgetValue value={values.min} label={t('network.min')} />
            <WidgetValue value={values.median} label={t('network.med')} />
            <WidgetValue
                value={values.percentile95}
                label={t('network.pct95')}
            />
            <WidgetValue value={values.max} label={t('network.max')} />
        </Widget>
    );
};
