import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../../../../style/sampler.module.scss';
import SamplerData from '../../SamplerData';
import { AiUsage } from '../../logic/ai';
import {
    AiReport,
    buildGcRows,
    buildHotspots,
    buildLocalMetrics,
    ConfigSuggestion,
    GcRow,
    MetricCard,
    MetricStatus,
} from '../../logic/aiReport';

export interface AiReportViewProps {
    report: AiReport;
    data: SamplerData;
    usage?: AiUsage;
}

function formatDuration(ms: number, t: (k: string) => string): string {
    if (ms <= 0) return '-';
    if (ms < 1000) return Math.round(ms) + 'ms';
    const totalSec = Math.round(ms / 1000);
    if (totalSec < 60) return totalSec + t('ai.time.s');
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const parts: string[] = [];
    if (h) parts.push(h + t('ai.time.h'));
    if (m) parts.push(m + t('ai.time.m'));
    if (s) parts.push(s + t('ai.time.s'));
    return parts.join(' ');
}

function StatusChip({ status }: { status: MetricStatus }) {
    const { t } = useTranslation('sampler');
    return (
        <span className={`${styles['ai-chip']} ${styles['ai-chip-' + status]}`}>
            {t(`ai.status.${status}`)}
        </span>
    );
}

function SectionTitle({ title, count }: { title: string; count?: number }) {
    return (
        <h3 className={styles['ai-section-title']}>
            {title}
            {count !== undefined && (
                <span className={styles['ai-count']}>{count}</span>
            )}
        </h3>
    );
}

function MetricCardView({ metric }: { metric: MetricCard }) {
    const { t } = useTranslation('sampler');
    return (
        <div
            className={`${styles['ai-metric']} ${styles['ai-metric-' + metric.status]}`}
        >
            <div className={styles['ai-metric-head']}>
                <StatusChip status={metric.status} />
                <span className={styles['ai-metric-name']}>
                    {t(`ai.metrics.${metric.id}`)}
                </span>
            </div>
            <div className={styles['ai-metric-values']}>
                {metric.values.map((v, i) => (
                    <span key={i}>
                        {v.label && (
                            <span className={styles['ai-metric-label']}>
                                {t(`ai.valueLabels.${v.label}`)}
                            </span>
                        )}
                        {v.value}
                    </span>
                ))}
            </div>
            <p className={styles['ai-metric-note']}>
                {t(`ai.metricNotes.${metric.id}`)}
            </p>
        </div>
    );
}

function GcRowView({ row }: { row: GcRow }) {
    const { t } = useTranslation('sampler');
    return (
        <div className={styles['ai-gc-row']}>
            <div className={styles['ai-gc-name']}>
                <span>{row.name}</span>
                <small>
                    {row.collections} {t('ai.gc.collections')}
                </small>
            </div>
            <div className={styles['ai-gc-cell']}>
                <small>{t('ai.gc.avgPause')}</small>
                <span>{formatDuration(row.avgTimeMs, t)}</span>
            </div>
            <div className={styles['ai-gc-cell']}>
                <small>{t('ai.gc.avgInterval')}</small>
                <span>{formatDuration(row.avgIntervalMs, t)}</span>
            </div>
            <StatusChip status={row.status} />
        </div>
    );
}

function ConfigSuggestionRow({ item }: { item: ConfigSuggestion }) {
    const { t } = useTranslation('sampler');
    return (
        <div className={styles['ai-config-item']}>
            <div className={styles['ai-config-head']}>
                {item.file && (
                    <span className={styles['ai-config-file']}>
                        {item.file}
                    </span>
                )}
                {item.setting && (
                    <code className={styles['ai-config-key']}>
                        {item.setting}
                    </code>
                )}
            </div>
            {(item.current || item.suggested) && (
                <div className={styles['ai-config-change']}>
                    {item.current && (
                        <span className={styles['ai-config-current']}>
                            {item.current}
                        </span>
                    )}
                    {item.current && item.suggested && (
                        <span className={styles['ai-config-arrow']}>→</span>
                    )}
                    {item.suggested && (
                        <span className={styles['ai-config-suggested']}>
                            {item.suggested}
                        </span>
                    )}
                </div>
            )}
            {item.reason && (
                <p className={styles['ai-config-reason']}>
                    {t('ai.config.reason')}: {item.reason}
                </p>
            )}
        </div>
    );
}

function TokenBar({ usage }: { usage: AiUsage }) {
    const { t } = useTranslation('sampler');
    const hasCache =
        usage.cacheHit !== undefined && usage.cacheMiss !== undefined;
    const hitRate =
        hasCache && usage.cacheHit! + usage.cacheMiss! > 0
            ? (
                  (usage.cacheHit! / (usage.cacheHit! + usage.cacheMiss!)) *
                  100
              ).toFixed(1) + '%'
            : undefined;

    return (
        <div className={styles['ai-tokens']}>
            <div>
                <small>{t('ai.tokens.inputNoCache')}</small>
                <span>{hasCache ? usage.cacheMiss : usage.prompt}</span>
            </div>
            <div>
                <small>{t('ai.tokens.inputCached')}</small>
                <span>{hasCache ? usage.cacheHit : '-'}</span>
            </div>
            <div>
                <small>{t('ai.tokens.output')}</small>
                <span>{usage.completion}</span>
            </div>
            <div>
                <small>{t('ai.tokens.total')}</small>
                <span>{usage.total}</span>
            </div>
            <div>
                <small>{t('ai.tokens.hitRate')}</small>
                <span>{hitRate ?? '-'}</span>
            </div>
        </div>
    );
}

/**
 * Renders a structured AI report: local metric/GC/hotspot sections computed
 * from the profile plus the model's overview/diagnosis/recommendations.
 */
export default function AiReportView({
    report,
    data,
    usage,
}: AiReportViewProps) {
    const { t } = useTranslation('sampler');
    const metrics = useMemo(() => buildLocalMetrics(data), [data]);
    const gcRows = useMemo(() => buildGcRows(data), [data]);
    const hotspots = useMemo(() => buildHotspots(data), [data]);
    const abnormal = metrics.filter(m => m.status !== 'ok');

    return (
        <div className={styles['ai-report']}>
            {report.overview && (
                <section>
                    <SectionTitle title={t('ai.sections.conclusion')} />
                    <p className={styles['ai-overview']}>{report.overview}</p>
                </section>
            )}

            {abnormal.length > 0 && (
                <section>
                    <SectionTitle
                        title={t('ai.sections.abnormal')}
                        count={abnormal.length}
                    />
                    <div className={styles['ai-metric-grid']}>
                        {abnormal.map(m => (
                            <MetricCardView key={m.id} metric={m} />
                        ))}
                    </div>
                </section>
            )}

            {gcRows.length > 0 && (
                <section>
                    <SectionTitle
                        title={t('ai.sections.gc')}
                        count={gcRows.length}
                    />
                    <div className={styles['ai-gc-list']}>
                        {gcRows.map(row => (
                            <GcRowView key={row.name} row={row} />
                        ))}
                    </div>
                </section>
            )}

            {report.diagnosis.length > 0 && (
                <section>
                    <SectionTitle
                        title={t('ai.sections.diagnosis')}
                        count={report.diagnosis.length}
                    />
                    <div className={styles['ai-diagnosis']}>
                        {report.diagnosis.map((d, i) => (
                            <div
                                key={i}
                                className={styles['ai-diagnosis-item']}
                            >
                                <span className={styles['ai-diagnosis-title']}>
                                    {d.title}
                                </span>
                                <p>{d.detail}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {hotspots.length > 0 && (
                <section>
                    <SectionTitle
                        title={t('ai.sections.hotspots')}
                        count={hotspots.length}
                    />
                    <div className={styles['ai-hotspots']}>
                        {hotspots.map((h, i) => (
                            <div key={i} className={styles['ai-hotspot-row']}>
                                <span className={styles['ai-hotspot-source']}>
                                    {h.source || t('ai.hotspots.internal')}
                                </span>
                                <span className={styles['ai-hotspot-pct']}>
                                    {h.pct}%
                                </span>
                                <code className={styles['ai-hotspot-method']}>
                                    {h.method}
                                </code>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {report.configSuggestions.length > 0 && (
                <section>
                    <SectionTitle
                        title={t('ai.sections.configSuggestions')}
                        count={report.configSuggestions.length}
                    />
                    <div className={styles['ai-config-suggestions']}>
                        {report.configSuggestions.map((c, i) => (
                            <ConfigSuggestionRow key={i} item={c} />
                        ))}
                    </div>
                </section>
            )}

            {report.recommendations.length > 0 && (
                <section>
                    <SectionTitle
                        title={t('ai.sections.steps')}
                        count={report.recommendations.length}
                    />
                    <ol className={styles['ai-steps']}>
                        {report.recommendations.map((r, i) => (
                            <li key={i}>
                                <span className={styles['ai-step-num']}>
                                    {i + 1}
                                </span>
                                <span>{r}</span>
                            </li>
                        ))}
                    </ol>
                </section>
            )}

            {usage && <TokenBar usage={usage} />}
        </div>
    );
}
