import SamplerData from '../SamplerData';
import { buildProfileSummary } from './aiSummary';

export type AiRequestMode = 'direct' | 'proxy';

export interface AiSettings {
    baseUrl: string;
    apiKey: string;
    model: string;
    /** direct = browser calls the endpoint, proxy = via this site's /api/ai */
    mode: AiRequestMode;
}

export interface AiPreset {
    id: string;
    label: string;
    baseUrl: string;
    model: string;
}

export const AI_PRESETS: AiPreset[] = [
    {
        id: 'openai',
        label: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o-mini',
    },
    {
        id: 'deepseek',
        label: 'DeepSeek',
        baseUrl: 'https://api.deepseek.com/v1',
        model: 'deepseek-chat',
    },
    {
        id: 'moonshot',
        label: 'Moonshot (Kimi)',
        baseUrl: 'https://api.moonshot.cn/v1',
        model: 'moonshot-v1-32k',
    },
    {
        id: 'openrouter',
        label: 'OpenRouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        model: 'deepseek/deepseek-chat-v3-0324',
    },
    {
        id: 'ollama',
        label: 'Ollama (local)',
        baseUrl: 'http://localhost:11434/v1',
        model: 'qwen2.5',
    },
    {
        id: 'custom',
        label: 'Custom',
        baseUrl: '',
        model: '',
    },
];

const STORAGE_KEY = 'spark.llm';

/** The stream ended without yielding a single content delta. */
export class EmptyResponseError extends Error {
    /** first chars of the raw response, for diagnostics */
    readonly raw: string;
    /** reasoning-only frames were seen (e.g. deepseek-reasoner) */
    readonly hadReasoning: boolean;

    constructor(raw: string, hadReasoning: boolean) {
        super('empty response');
        this.name = 'EmptyResponseError';
        this.raw = raw;
        this.hadReasoning = hadReasoning;
    }
}

/** A direct (browser → endpoint) request failed, e.g. CORS or DNS. */
export class DirectNetworkError extends Error {
    constructor(detail: string) {
        super(detail);
        this.name = 'DirectNetworkError';
    }
}

export function loadAiSettings(): AiSettings {
    const fallback = (): AiSettings => ({
        baseUrl: AI_PRESETS[0].baseUrl,
        apiKey: '',
        model: AI_PRESETS[0].model,
        mode: 'direct',
    });
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as Partial<AiSettings>;
            if (
                typeof parsed.baseUrl === 'string' &&
                typeof parsed.apiKey === 'string' &&
                typeof parsed.model === 'string'
            ) {
                return {
                    baseUrl: parsed.baseUrl,
                    apiKey: parsed.apiKey,
                    model: parsed.model,
                    mode: parsed.mode === 'proxy' ? 'proxy' : 'direct',
                };
            }
        }
    } catch {
        // fall through to defaults
    }
    return fallback();
}

export function saveAiSettings(settings: AiSettings): void {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
        // storage unavailable - settings just won't persist
    }
}

export function presetFor(settings: AiSettings): string {
    const match = AI_PRESETS.find(
        p => p.id !== 'custom' && p.baseUrl === settings.baseUrl
    );
    return match ? match.id : 'custom';
}

export function buildAiMessages(
    data: SamplerData,
    language: string
): { role: 'system' | 'user'; content: string }[] {
    const summary = buildProfileSummary(data);
    const lang = language.toLowerCase().startsWith('zh')
        ? 'Simplified Chinese (简体中文)'
        : 'English';

    const system = [
        'You are an expert Minecraft server performance analyst.',
        'You will receive a JSON summary of a spark profiler report (server/system statistics and the hottest sampled methods).',
        'Respond with ONLY a valid JSON object - no markdown, no code fences, no commentary before or after - using exactly this schema:',
        '{',
        '  "overview": "2-4 sentences: the overall health conclusion of the server",',
        '  "diagnosis": [{"title": "short finding title", "detail": "1-2 sentences explaining it with exact numbers from the data"}],',
        '  "recommendations": ["prioritized actionable step", ...]',
        '}',
        'Rules:',
        '- diagnosis: 3-6 items ordered by severity; recommendations: 3-6 items ordered by priority.',
        '- Only state facts present in the data; never invent plugin or mod names.',
        '- Reference exact numbers (%, ms, MB) from the data; if a field is missing, say the data is unavailable.',
        '- Node times are in the unit given by the "unit" field.',
        `- Respond in ${lang}.`,
    ].join('\n');

    const user =
        'Profile summary (JSON):\n' + JSON.stringify(summary, undefined, 2);

    return [
        { role: 'system', content: system },
        { role: 'user', content: user },
    ];
}

/** Token usage of one completion (as reported by the endpoint). */
export interface AiUsage {
    prompt: number;
    completion: number;
    total: number;
    cacheHit?: number;
    cacheMiss?: number;
}

export interface StreamAiOptions {
    settings: AiSettings;
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
    onChunk: (text: string) => void;
    onUsage?: (usage: AiUsage) => void;
    signal?: AbortSignal;
}

function normalizeUsage(u: Record<string, unknown>): AiUsage | undefined {
    const num = (v: unknown) => (typeof v === 'number' ? v : undefined);
    const prompt = num(u.prompt_tokens);
    const completion = num(u.completion_tokens);
    const total = num(u.total_tokens);
    if (prompt === undefined && completion === undefined) return undefined;
    return {
        prompt: prompt ?? 0,
        completion: completion ?? 0,
        total: total ?? (prompt ?? 0) + (completion ?? 0),
        cacheHit: num(u.prompt_cache_hit_tokens),
        cacheMiss: num(u.prompt_cache_miss_tokens),
    };
}

/**
 * Runs one chat completion against the configured endpoint.
 * - mode 'direct': the browser calls <baseUrl>/chat/completions itself
 * - mode 'proxy':  the request goes through this site's /api/ai route
 *
 * Throws EmptyResponseError / DirectNetworkError / plain Error.
 */
export async function streamAiAnalysis({
    settings,
    messages,
    onChunk,
    onUsage,
    signal,
}: StreamAiOptions): Promise<void> {
    const direct = settings.mode !== 'proxy';
    const url = direct
        ? settings.baseUrl.replace(/\/+$/, '') + '/chat/completions'
        : '/api/ai';

    const body = direct
        ? {
              model: settings.model,
              messages,
              stream: true,
              stream_options: { include_usage: true },
              temperature: 0.4,
              max_tokens: 8192,
          }
        : {
              baseUrl: settings.baseUrl,
              apiKey: settings.apiKey,
              model: settings.model,
              messages,
          };

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (direct) headers.Authorization = `Bearer ${settings.apiKey}`;

    let res: Response;
    try {
        res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal,
        });
    } catch (err) {
        if ((err as Error).name === 'AbortError') throw err;
        const detail = err instanceof Error ? err.message : String(err);
        if (direct) throw new DirectNetworkError(detail);
        throw new Error('Request failed: ' + detail);
    }

    if (!res.ok) {
        let message = `HTTP ${res.status}`;
        try {
            const parsed = await res.json();
            const parts: string[] = [];
            if (typeof parsed?.error?.message === 'string') {
                parts.push(parsed.error.message);
            } else if (typeof parsed?.error === 'string') {
                parts.push(parsed.error);
            }
            if (typeof parsed?.detail === 'string') {
                parts.push(parsed.detail);
            }
            if (parts.length) message = parts.join(': ');
        } catch {
            // keep the status fallback
        }
        throw new Error(message);
    }
    if (!res.body) throw new Error('Empty response from server');

    const contentType = res.headers.get('content-type') ?? '';

    // Some endpoints ignore `stream` and answer with a plain JSON body.
    if (contentType.includes('application/json')) {
        const text = await res.text();
        const content = extractContent(text);
        if (content) {
            onChunk(content);
            return;
        }
        throw new EmptyResponseError(
            text.slice(0, 4000),
            text.includes('reasoning_content')
        );
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let raw = '';
    let emitted = false;
    let reasoningSeen = false;
    const emit = (data: string) => {
        if (data === '[DONE]') return;
        try {
            const parsed = JSON.parse(data);
            if (parsed?.usage && onUsage) {
                const usage = normalizeUsage(parsed.usage);
                if (usage) onUsage(usage);
            }
            const choice = parsed?.choices?.[0];
            const delta = choice?.delta?.content ?? choice?.message?.content;
            if (typeof delta === 'string' && delta) {
                emitted = true;
                onChunk(delta);
            } else if (choice?.delta?.reasoning_content) {
                reasoningSeen = true;
            }
        } catch {
            // ignore malformed SSE frames
        }
    };

    try {
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value, { stream: true });
            if (raw.length < 500_000) raw += text;
            buffer += text;
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith('data:')) continue;
                emit(trimmed.slice(5).trim());
            }
        }
        buffer += decoder.decode();
        if (buffer.trim().startsWith('data:')) {
            emit(buffer.trim().slice(5).trim());
        }
    } catch (err) {
        if ((err as Error).name === 'AbortError') throw err;
        if (direct) {
            throw new DirectNetworkError(
                err instanceof Error ? err.message : String(err)
            );
        }
        throw err;
    }

    if (!emitted) {
        // maybe the whole body was a single (non-SSE) JSON document
        const content = extractContent(raw);
        if (content) {
            onChunk(content);
            return;
        }
        throw new EmptyResponseError(
            raw.slice(0, 4000),
            reasoningSeen || raw.includes('reasoning_content')
        );
    }
}

/** Extracts assistant content from a non-streaming chat completion JSON body. */
function extractContent(text: string): string | undefined {
    try {
        const parsed = JSON.parse(text);
        const choice = parsed?.choices?.[0];
        const content = choice?.message?.content ?? choice?.delta?.content;
        return typeof content === 'string' && content ? content : undefined;
    } catch {
        return undefined;
    }
}
