import {
    PlatformMetadata_Type,
    SamplerMetadata_SamplerEngine,
    SamplerMetadata_SamplerMode,
} from '../../proto/spark_pb';
import SamplerData from '../SamplerData';

const TOP_METHODS = 40;
const TOP_THREADS = 12;
const TOP_SOURCES = 15;
const TOP_ENTITIES = 10;
const MAX_WINDOWS = 12;
const MAX_JSON_CHARS = 60_000;
const MAX_CONFIG_FILES = 20;
const MAX_CONFIG_FILE_CHARS = 20_000;
const MAX_CONFIG_TOTAL_CHARS = 80_000;

export interface ProfileSummaryOptions {
    /** include the raw contents of server config files (opt-in) */
    includeConfigs?: boolean;
}

interface MethodEntry {
    method: string;
    total: number;
    self: number;
    pctOfProfile: number;
    source?: string;
}

interface ThreadEntry {
    thread: string;
    time: number;
    pctOfProfile: number;
    hottestFrame?: string;
}

function round(value: number, digits = 2): number {
    return Number.isFinite(value) ? Number(value.toFixed(digits)) : 0;
}

function enumName(e: object, value: number): string | undefined {
    return (e as Record<number, string>)[value];
}

function pct(part: number, whole: number): number {
    return whole > 0 ? round((part / whole) * 100) : 0;
}

function nodeSelfTime(node: { time: number; children: { time: number }[] }) {
    const children = node.children.reduce((a, c) => a + c.time, 0);
    return Math.max(node.time - children, 0);
}

/**
 * Collects the raw server config file contents, bounded in both per-file and
 * total size. Values are sent verbatim (opt-in) - they may contain secrets.
 */
function buildConfigurations(
    map: Record<string, string> | undefined
): Record<string, string> | undefined {
    if (!map) return undefined;
    const out: Record<string, string> = {};
    let total = 0;
    let count = 0;
    for (const [name, raw] of Object.entries(map)) {
        if (count >= MAX_CONFIG_FILES) break;
        if (typeof raw !== 'string') continue;
        const trimmed =
            raw.length > MAX_CONFIG_FILE_CHARS
                ? raw.slice(0, MAX_CONFIG_FILE_CHARS) + '\n... (truncated)'
                : raw;
        if (total + trimmed.length > MAX_CONFIG_TOTAL_CHARS) break;
        total += trimmed.length;
        out[name] = trimmed;
        count++;
    }
    return Object.keys(out).length ? out : undefined;
}

/**
 * Builds a compact JSON-serializable summary of a sampler profile,
 * suitable for sending to an LLM (a few tens of KB at most).
 */
export function buildProfileSummary(
    data: SamplerData,
    options: ProfileSummaryOptions = {}
): Record<string, unknown> {
    const meta = data.metadata;
    const allocationMode =
        meta?.samplerMode === SamplerMetadata_SamplerMode.ALLOCATION;
    // in EXECUTION mode node times are ms, in ALLOCATION mode they are bytes
    const unit = allocationMode ? 'bytes' : 'ms';

    const threadNodes = data.nodes.threadNodes;
    const stackNodes = data.nodes.stackTraceNodes;
    const profileTotal = threadNodes.reduce((a, n) => a + n.time, 0);

    // --- hotspots -------------------------------------------------------
    const methods: MethodEntry[] = stackNodes.map(node => ({
        method: node.className
            ? `${node.className}.${node.methodName || '<init>'}`
            : node.methodName,
        total: round(node.time),
        self: round(nodeSelfTime(node)),
        pctOfProfile: pct(node.time, profileTotal),
        source: data.sources.getSource(node.id),
    }));

    const topByTotal = [...methods]
        .sort((a, b) => b.total - a.total)
        .slice(0, TOP_METHODS)
        .map(m => ({
            method: m.method,
            [`total${unit}`]: m.total,
            [`self${unit}`]: m.self,
            pctOfProfile: m.pctOfProfile,
            ...(m.source ? { source: m.source } : {}),
        }));

    const topBySelf = [...methods]
        .sort((a, b) => b.self - a.self)
        .slice(0, TOP_METHODS)
        .map(m => ({
            method: m.method,
            [`self${unit}`]: m.self,
            pctOfProfile: m.pctOfProfile,
            ...(m.source ? { source: m.source } : {}),
        }));

    const topThreads: ThreadEntry[] = threadNodes
        .map(thread => {
            const hottest = [...thread.children].sort(
                (a, b) => b.time - a.time
            )[0];
            return {
                thread: thread.name,
                time: round(thread.time),
                pctOfProfile: pct(thread.time, profileTotal),
                hottestFrame: hottest
                    ? `${hottest.className}.${hottest.methodName}`
                    : undefined,
            };
        })
        .sort((a, b) => b.time - a.time)
        .slice(0, TOP_THREADS);

    // --- per-plugin/mod attribution -------------------------------------
    const sourceTotals = new Map<string, number>();
    for (const node of stackNodes) {
        const source = data.sources.getSource(node.id);
        if (source) {
            sourceTotals.set(
                source,
                (sourceTotals.get(source) ?? 0) + node.time
            );
        }
    }
    const topSources = [...sourceTotals.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, TOP_SOURCES)
        .map(([source, time]) => ({
            source,
            [`total${unit}`]: round(time),
            pctOfProfile: pct(time, profileTotal),
        }));

    // --- statistics ------------------------------------------------------
    const ps = meta?.platformStatistics;
    const ss = meta?.systemStatistics;
    const mb = (bytes: number) => round(bytes / (1024 * 1024), 1);

    const summary: Record<string, unknown> = {
        profile: {
            mode: allocationMode ? 'ALLOCATION' : 'EXECUTION',
            unit,
            comment: meta?.comment || undefined,
            intervalMs: meta?.interval || undefined,
            durationMs:
                meta && meta.endTime > meta.startTime
                    ? meta.endTime - meta.startTime
                    : undefined,
            ticks: meta?.numberOfTicks || undefined,
            engine: meta
                ? enumName(SamplerMetadata_SamplerEngine, meta.samplerEngine)
                : undefined,
            platform: meta?.platform
                ? {
                      type: enumName(PlatformMetadata_Type, meta.platform.type),
                      name: meta.platform.name,
                      version: meta.platform.version,
                      minecraftVersion: meta.platform.minecraftVersion,
                      sparkVersion: meta.platform.sparkVersion,
                      brand: meta.platform.brand || undefined,
                  }
                : undefined,
            user: meta?.user?.name || undefined,
            configFiles: meta?.serverConfigurations
                ? Object.keys(meta.serverConfigurations).slice(0, 30)
                : undefined,
        },
        system: ss
            ? {
                  os: ss.os
                      ? `${ss.os.name} ${ss.os.version} (${ss.os.arch})`
                      : undefined,
                  cpu: ss.cpu
                      ? {
                            model: ss.cpu.modelName || undefined,
                            threads: ss.cpu.threads,
                            processUsagePct1m: ss.cpu.processUsage?.last1M,
                            systemUsagePct1m: ss.cpu.systemUsage?.last1M,
                        }
                      : undefined,
                  memory: {
                      physicalUsedMb: ss.memory?.physical
                          ? mb(ss.memory.physical.used)
                          : undefined,
                      physicalTotalMb: ss.memory?.physical
                          ? mb(ss.memory.physical.total)
                          : undefined,
                      swapUsedMb: ss.memory?.swap
                          ? mb(ss.memory.swap.used)
                          : undefined,
                  },
                  diskUsedMb: ss.disk ? mb(ss.disk.used) : undefined,
                  diskTotalMb: ss.disk ? mb(ss.disk.total) : undefined,
                  java: ss.java
                      ? {
                            vendor: ss.java.vendor,
                            version: ss.java.version,
                            vmArgs:
                                ss.java.vmArgs.length > 2000
                                    ? ss.java.vmArgs.slice(0, 2000)
                                    : ss.java.vmArgs || undefined,
                        }
                      : undefined,
                  jvm: ss.jvm
                      ? `${ss.jvm.name} (${ss.jvm.vendor} ${ss.jvm.version})`
                      : undefined,
                  uptimeMs: ss.uptime || undefined,
              }
            : undefined,
        game: ps
            ? {
                  players: ps.playerCount || undefined,
                  tps: ps.tps
                      ? {
                            last1m: round(ps.tps.last1M),
                            last5m: round(ps.tps.last5M),
                            last15m: round(ps.tps.last15M),
                            target: ps.tps.gameTargetTps || undefined,
                        }
                      : undefined,
                  mspt: ps.mspt?.last1M
                      ? {
                            mean: round(ps.mspt.last1M.mean),
                            median: round(ps.mspt.last1M.median),
                            p95: round(ps.mspt.last1M.percentile95),
                            max: round(ps.mspt.last1M.max),
                            min: round(ps.mspt.last1M.min),
                            idealMaxMspt: ps.mspt.gameMaxIdealMspt || undefined,
                        }
                      : undefined,
                  pingMedianMs: ps.ping?.last15M
                      ? round(ps.ping.last15M.median)
                      : undefined,
                  memory: ps.memory
                      ? {
                            heapUsedMb: ps.memory.heap
                                ? mb(ps.memory.heap.used)
                                : undefined,
                            heapMaxMb: ps.memory.heap
                                ? mb(ps.memory.heap.max)
                                : undefined,
                            heapCommittedMb: ps.memory.heap
                                ? mb(ps.memory.heap.committed)
                                : undefined,
                            nonHeapUsedMb: ps.memory.nonHeap
                                ? mb(ps.memory.nonHeap.used)
                                : undefined,
                            allocPerSecMb:
                                ps.memory.allocBpsLast1M?.mean !== undefined
                                    ? mb(ps.memory.allocBpsLast1M.mean)
                                    : undefined,
                        }
                      : undefined,
                  gc: Object.fromEntries(
                      Object.entries(ps.gc).map(([name, g]) => [
                          name,
                          {
                              collections: g.total,
                              avgTimeMs: round(g.avgTime),
                              avgFrequencyMs: round(g.avgFrequency),
                          },
                      ])
                  ),
                  world: ps.world
                      ? {
                            totalEntities: ps.world.totalEntities,
                            topEntities: Object.entries(ps.world.entityCounts)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, TOP_ENTITIES)
                                .map(([type, count]) => ({ type, count })),
                            worlds: ps.world.worlds.slice(0, 10).map(w => ({
                                name: w.name,
                                entities: w.totalEntities,
                            })),
                        }
                      : undefined,
              }
            : undefined,
        timeWindows: data.timeWindows
            .slice(-MAX_WINDOWS)
            .map(key => {
                const w = data.timeWindowStatistics[key];
                if (!w) return undefined;
                return {
                    durationMs: w.duration,
                    tps: round(w.tps),
                    msptMedian: round(w.msptMedian),
                    msptMax: round(w.msptMax),
                    cpuProcessPct: round(w.cpuProcess),
                    cpuSystemPct: round(w.cpuSystem),
                    players: w.players,
                    entities: w.entities,
                    tileEntities: w.tileEntities,
                    chunks: w.chunks,
                };
            })
            .filter(Boolean),
        hotspots: {
            note: `times are in ${unit}; pctOfProfile = share of total sampled ${unit} across all threads`,
            threads: topThreads,
            methodsByTotalTime: topByTotal,
            methodsBySelfTime: topBySelf,
            sources: topSources.length ? topSources : undefined,
        },
    };

    if (options.includeConfigs) {
        const configurations = buildConfigurations(meta?.serverConfigurations);
        if (configurations) summary.configurations = configurations;
    }

    const budget = options.includeConfigs
        ? MAX_JSON_CHARS + MAX_CONFIG_TOTAL_CHARS
        : MAX_JSON_CHARS;
    return fit(summary, budget);
}

/**
 * Drops lower-priority sections until the serialized summary fits the budget.
 */
function fit(
    summary: Record<string, unknown>,
    budget = MAX_JSON_CHARS
): Record<string, unknown> {
    const serialize = (s: Record<string, unknown>) => JSON.stringify(s);
    if (serialize(summary).length <= budget) return summary;

    const hotspots = summary.hotspots as Record<string, unknown>;
    delete hotspots.methodsByTotalTime;
    if (serialize(summary).length <= budget) return summary;

    delete (summary as { timeWindows?: unknown }).timeWindows;
    if (serialize(summary).length <= budget) return summary;

    delete hotspots.methodsBySelfTime;
    return summary;
}
