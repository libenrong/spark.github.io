import { useTranslation } from 'react-i18next';
import { PlatformStatistics_Mspt } from '../../../../proto/spark_pb';
import { formatNumber } from '../../../util/format';
import { Formatter, WidgetFormat } from '../format';
import Widget from '../Widget';
import WidgetValue from '../WidgetValue';

export interface MsptWidgetProps {
    mspt: PlatformStatistics_Mspt;
}

export default function MsptWidget({ mspt }: MsptWidgetProps) {
    const { t } = useTranslation('widgets');
    const thresholds = {
        green: 50,
        yellow: 40,
    };
    if (mspt.gameMaxIdealMspt > 0) {
        thresholds.green = mspt.gameMaxIdealMspt;
        thresholds.yellow = mspt.gameMaxIdealMspt * 0.8;
    }

    const formatter: Formatter = {
        color: value => {
            if (value >= thresholds.green) {
                return WidgetFormat.colors.red;
            } else if (value >= thresholds.yellow) {
                return WidgetFormat.colors.yellow;
            } else {
                return WidgetFormat.colors.green;
            }
        },
        format: value => {
            return formatNumber(value);
        },
    };

    return (
        <Widget id="mspt" title={t('title.mspt')} formatter={formatter}>
            <WidgetValue value={mspt.last5M!.min} label={t('stat.min')} />
            <WidgetValue value={mspt.last5M!.median} label={t('stat.med')} />
            <WidgetValue
                value={mspt.last5M!.percentile95}
                label={t('stat.pct95')}
            />
            <WidgetValue value={mspt.last5M!.max} label={t('stat.max')} />
        </Widget>
    );
}
