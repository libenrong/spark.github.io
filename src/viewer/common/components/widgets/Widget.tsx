import { ReactNode } from 'react';
import { Formatter, WidgetFormat, WidgetFormatter } from './format';

export interface WidgetProps {
    title: string;
    /** Stable identifier used for the CSS class (not translated). */
    id?: string;
    label?: string;
    formatter?: Formatter;
    children: ReactNode;
}

export default function Widget({
    title,
    id,
    label,
    formatter = WidgetFormat.defaultFormatter,
    children,
}: WidgetProps) {
    return (
        <div className={`widget widget-${(id ?? title).toLowerCase()}`}>
            <h1>
                {title}
                {label && <span>({label})</span>}
            </h1>
            <div className="widget-values">
                <WidgetFormatter.Provider value={formatter}>
                    {children}
                </WidgetFormatter.Provider>
            </div>
        </div>
    );
}
