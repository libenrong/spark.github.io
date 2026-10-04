import { useTranslation } from 'react-i18next';
import { SystemStatistics_Disk } from '../../../../proto/spark_pb';
import { formatBytes } from '../../../util/format';
import { Formatter, WidgetFormat } from '../format';
import Widget from '../Widget';
import WidgetSingleValue from '../WidgetSingleValue';

export interface DiskWidgetProps {
    disk: SystemStatistics_Disk;
}

export default function DiskWidget({ disk }: DiskWidgetProps) {
    const { t } = useTranslation('widgets');
    const formatter: Formatter = {
        color: (value, total) => {
            const percent = value / total;
            if (percent > 0.95) {
                return WidgetFormat.colors.red;
            } else if (percent > 0.8) {
                return WidgetFormat.colors.yellow;
            } else {
                return WidgetFormat.colors.green;
            }
        },
        format: value => {
            return formatBytes(value);
        },
    };

    return (
        <Widget id="disk" title={t('title.disk')} formatter={formatter}>
            <WidgetSingleValue value={disk.used} total={disk.total} />
        </Widget>
    );
}
