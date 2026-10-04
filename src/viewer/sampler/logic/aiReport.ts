import SamplerData from '../SamplerData';

export type MetricStatus = 'ok' | 'warn' | 'bad';

export interface MetricValue {
    label?: string;
    value: string;
}

export interface MetricCard {
    id: 'tps' | 'mspt' | 'heap' | 'cpu' | 'ping';
    status: MetricStatus;
    values: MetricValue[];
}

export interface GcRow {
    name: string;
    collections: number;
    avgTimeMs: number;
    avgIntervalMs: number;
    status: MetricStatus;
}

export interface HotspotRow {
    source?: string;
    pct: number;
    method: string;
}

export interface DiagnosisItem {
    title: string;
    detail: string;
}

/** Structured analysis returned by the model. */
export interface AiReport {
    overview: string;
    diagnosis: DiagnosisItem[];
    recommendations: string[];
}

function round(value: number, digits = 2): number {
    return Number.isFinite(value) ? Number(value.toFixed(digits)) : 0;
}

/**
 * Models love to sprinkle markdown emphasis into plain-text fields -
 * strip it so card views don't show literal ** or ` markers.
 */
function stripMarkdown(s: string): string {
    return s
        .replace(/\*{1,3}([^*\n]+?)\*{1,3}/g, '$1')
        .replace(/`([^`\n]+)`/g, '$1')
        .replace(/^[-*]\s+/, '')
        .trim();
}

/**
 * Parses the model output as a structured JSON report.
 * Tolerates code fences around the JSON. Returns undefined if the text
 * is not a valid report (callers then fall back to markdown rendering).
 */
export function parseAiReport(text: string): AiReport | undefined {
    let t = text.trim();
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
    const start = t.indexOf('{');
    const end = t.lastIndexOf('}');
    if (start < 0 || end <= start) return undefined;

    let parsed: unknown;
    try {
        parsed = JSON.parse(t.slice(start, end + 1));
    } catch {
        return undefined;
    }
    if (!parsed || typeof parsed !== 'object') return undefined;

    const obj = parsed as Record<string, unknown>;
    const overview =
        typeof obj.overview === 'string' ? stripMarkdown(obj.overview) : '';

    const diagnosis: DiagnosisItem[] = [];
    if (Array.isArray(obj.diagnosis)) {
        for (const item of obj.diagnosis) {
            if (!item || typeof item !== 'object') continue;
            const d = item as Record<string, unknown>;
            const title =
                typeof d.title === 'string'
                    ? stripMarkdown(d.title)
                    : typeof d.name === 'string'
                      ? stripMarkdown(d.name)
                      : '';
            const detail =
                typeof d.detail === 'string'
                    ? stripMarkdown(d.detail)
                    : typeof d.description === 'string'
                      ? stripMarkdown(d.description)
                      : '';
            if (title || detail) diagnosis.push({ title, detail });
        }
    }

    const recommendations: string[] = [];
    if (Array.isArray(obj.recommendations)) {
        for (const r of obj.recommendations) {
            if (typeof r === 'string' && r.trim())
                recommendations.push(stripMarkdown(r));
        }
    }

    if (!overview && !diagnosis.length && !recommendations.length) {
        return undefined;
    }
    return { overview, diagnosis, recommendations };
}

function classify(
    value: number,
    warnBelow: number,
    badBelow: number
): MetricStatus {
    if (value >= badBelow) return 'bad';
    if (value >= warnBelow) return 'warn';
    return 'ok';
}

/**
 * Computes metric cards (with status thresholds) locally from the profile -
 * deterministic, does not depend on the model.
 */
export function buildLocalMetrics(data: SamplerData): MetricCard[] {
    const ps = data.metadata?.platformStatistics;
    const ss = data.metadata?.systemStatistics;
    const cards: MetricCard[] = [];
    if (!ps) return cards;

    if (ps.tps) {
        const target = ps.tps.gameTargetTps || 20;
        const last1m = ps.tps.last1M;
        const status: MetricStatus =
            last1m >= target - 0.1
                ? 'ok'
                : last1m >= target - 1
                  ? 'warn'
                  : 'bad';
        cards.push({
            id: 'tps',
            status,
            values: [
                { label: '1m', value: round(ps.tps.last1M).toString() },
                { label: '5m', value: round(ps.tps.last5M).toString() },
                { label: '15m', value: round(ps.tps.last15M).toString() },
                { label: 'target', value: target.toString() },
            ],
        });
    }

    const mspt = ps.mspt?.last1M;
    if (mspt) {
        const persistent =
            mspt.median > 50 || mspt.percentile95 > 50 || mspt.max > 50;
        const approaching = mspt.median > 40 || mspt.percentile95 > 45;
        cards.push({
            id: 'mspt',
            status: persistent ? 'bad' : approaching ? 'warn' : 'ok',
            values: [
                { label: 'mean', value: round(mspt.mean) + ' ms' },
                { label: 'p95', value: round(mspt.percentile95) + ' ms' },
                { label: 'max', value: round(mspt.max) + ' ms' },
            ],
        });
    }

    const heap = ps.memory?.heap;
    if (heap && heap.max > 0) {
        const pct = (heap.used / heap.max) * 100;
        cards.push({
            id: 'heap',
            status: classify(pct, 75, 90),
            values: [
                { label: 'used', value: mb(heap.used) + ' MB' },
                { label: 'max', value: mb(heap.max) + ' MB' },
                { label: 'pct', value: round(pct, 1) + '%' },
            ],
        });
    }

    const cpu = ss?.cpu?.processUsage;
    if (cpu) {
        cards.push({
            id: 'cpu',
            status: classify(cpu.last1M, 70, 90),
            values: [{ label: 'process', value: round(cpu.last1M, 1) + '%' }],
        });
    }

    const ping = ps.ping?.last15M;
    if (ping) {
        cards.push({
            id: 'ping',
            status:
                ping.median > 150 ? 'bad' : ping.median > 80 ? 'warn' : 'ok',
            values: [{ label: 'median', value: round(ping.median) + ' ms' }],
        });
    }

    return cards;
}

function mb(bytes: number): number {
    return round(bytes / (1024 * 1024), 1);
}

/** One row per GC collector with a status classification. */
export function buildGcRows(data: SamplerData): GcRow[] {
    const gc = data.metadata?.platformStatistics?.gc ?? {};
    return Object.entries(gc).map(([name, g]) => ({
        name,
        collections: g.total,
        avgTimeMs: round(g.avgTime),
        avgIntervalMs: round(g.avgFrequency),
        status:
            g.total === 0
                ? 'ok'
                : g.avgTime > 100
                  ? 'bad'
                  : g.avgTime > 50
                    ? 'warn'
                    : 'ok',
    }));
}

/** Top methods by self (within-method) time, attributed to their source. */
export function buildHotspots(data: SamplerData, limit = 10): HotspotRow[] {
    const nodes = data.nodes.stackTraceNodes;
    const total = data.nodes.threadNodes.reduce((a, n) => a + n.time, 0);
    const rows: (HotspotRow & { self: number })[] = nodes.map(node => {
        const children = node.children.reduce((a, c) => a + c.time, 0);
        const self = Math.max(node.time - children, 0);
        return {
            source: data.sources.getSource(node.id),
            pct: total > 0 ? round((self / total) * 100) : 0,
            method: node.className
                ? `${node.className}.${node.methodName || '<init>'}`
                : node.methodName,
            self,
        };
    });
    return rows
        .sort((a, b) => b.self - a.self)
        .slice(0, limit)
        .map(({ source, pct, method }) => ({ source, pct, method }));
}
