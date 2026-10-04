import { useTranslation } from 'react-i18next';
import i18n from '../../../../../i18n';
import { SystemStatistics_Cpu_Usage } from '../../../../proto/spark_pb';
import { Formatter, WidgetFormat } from '../format';
import Widget from '../Widget';
import WidgetValue from '../WidgetValue';

export interface CpuWidgetProps {
    cpu: SystemStatistics_Cpu_Usage;
    label: string;
}

export default function CpuWidget({ cpu, label }: CpuWidgetProps) {
    const { t } = useTranslation('widgets');
    const formatter: Formatter = {
        color: value => {
            if (value > 0.9) {
                return WidgetFormat.colors.red;
            } else if (value > 0.65) {
                return WidgetFormat.colors.yellow;
            } else {
                return WidgetFormat.colors.green;
            }
        },
        format: value => {
            return (
                (value * 100).toLocaleString(i18n.language, {
                    maximumFractionDigits: 2,
                }) + '%'
            );
        },
    };

    return (
        <Widget
            id="cpu"
            title={t('title.cpu')}
            label={label}
            formatter={formatter}
        >
            <WidgetValue value={cpu.last1M} label={t('stat.oneMin')} />
            <WidgetValue value={cpu.last15M} label={t('stat.fifteenMin')} />
        </Widget>
    );
}
