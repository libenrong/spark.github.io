import { useTranslation } from 'react-i18next';
import i18n from '../../../../../i18n';
import { PlatformStatistics_Tps } from '../../../../proto/spark_pb';
import { Formatter, WidgetFormat } from '../format';
import Widget from '../Widget';
import WidgetValue from '../WidgetValue';

export interface TpsWidgetProps {
    tps: PlatformStatistics_Tps;
}

export default function TpsWidget({ tps }: TpsWidgetProps) {
    const { t } = useTranslation('widgets');
    const thresholds = {
        green: 18,
        yellow: 16,
    };
    if (tps.gameTargetTps > 0) {
        thresholds.green = tps.gameTargetTps * 0.9;
        thresholds.yellow = tps.gameTargetTps * 0.8;
    }

    const formatter: Formatter = {
        color: value => {
            if (value > thresholds.green) {
                return WidgetFormat.colors.green;
            } else if (value > thresholds.yellow) {
                return WidgetFormat.colors.yellow;
            } else {
                return WidgetFormat.colors.red;
            }
        },
        format: value => {
            return value.toLocaleString(i18n.language, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        },
    };

    return (
        <Widget id="tps" title={t('title.tps')} formatter={formatter}>
            <WidgetValue value={tps.last1M} label={t('stat.oneMin')} />
            <WidgetValue value={tps.last5M} label={t('stat.fiveMin')} />
            <WidgetValue value={tps.last15M} label={t('stat.fifteenMin')} />
        </Widget>
    );
}
