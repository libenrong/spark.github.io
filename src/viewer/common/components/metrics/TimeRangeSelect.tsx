import { useTranslation } from 'react-i18next';

export interface TimeRangeSelectProps {
    value: number;
    onChange: (value: number) => void;
}

const RANGES = [5, 15, 30, 60] as const;

export default function TimeRangeSelect({
    value,
    onChange,
}: TimeRangeSelectProps) {
    const { t } = useTranslation('metrics');
    return (
        <select
            className="range-selector"
            value={value}
            onChange={e => onChange(Number(e.target.value))}
        >
            {RANGES.map(range => (
                <option key={range} value={range}>
                    {t(`range.${range}`)}
                </option>
            ))}
        </select>
    );
}
