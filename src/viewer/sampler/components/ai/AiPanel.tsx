import {
    faCopy,
    faPaperPlane,
    faPlay,
    faRobot,
    faStop,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import TextBox from '../../../../components/TextBox';
import styles from '../../../../style/sampler.module.scss';
import SamplerData from '../../SamplerData';
import {
    AI_PRESETS,
    AiMessage,
    AiRequestMode,
    AiSettings,
    AiUsage,
    buildAiMessages,
    buildFollowUpMessages,
    EmptyResponseError,
    loadAiSettings,
    presetFor,
    saveAiSettings,
    streamAiAnalysis,
} from '../../logic/ai';
import { parseAiReport } from '../../logic/aiReport';
import AiMarkdown from './AiMarkdown';
import AiReportView from './AiReportView';

export interface AiPanelProps {
    data: SamplerData;
    onClose: () => void;
}

// static exports (GitHub Pages) have no server, so /api/ai doesn't exist
const STATIC_EXPORT = process.env.NEXT_PUBLIC_STATIC_EXPORT === '1';

export default function AiPanel({ data, onClose }: AiPanelProps) {
    const { t, i18n } = useTranslation('sampler');
    const [settings, setSettings] = useState<AiSettings>(loadAiSettings);
    const [presetId, setPresetId] = useState(() => presetFor(loadAiSettings()));
    const [running, setRunning] = useState(false);
    const [asking, setAsking] = useState(false);
    const [analysis, setAnalysis] = useState('');
    const [conversation, setConversation] = useState<AiMessage[]>([]);
    const [question, setQuestion] = useState('');
    const [pending, setPending] = useState('');
    const [error, setError] = useState('');
    const [rawPreview, setRawPreview] = useState('');
    const [usage, setUsage] = useState<AiUsage | undefined>(undefined);
    const [copied, setCopied] = useState(false);
    const abortRef = useRef<AbortController | undefined>(undefined);
    const outputRef = useRef<HTMLDivElement>(null);

    // structured report view once the streamed JSON becomes parseable
    const report = useMemo(
        () => (analysis ? parseAiReport(analysis) : undefined),
        [analysis]
    );

    // abort any in-flight request when the panel unmounts
    useEffect(() => () => abortRef.current?.abort(), []);

    // keep the streamed output scrolled to the bottom
    useEffect(() => {
        const el = outputRef.current;
        if (el && running) el.scrollTop = el.scrollHeight;
    }, [analysis, conversation, pending, running]);

    function resolveSettings(): AiSettings {
        return {
            baseUrl: settings.baseUrl.trim(),
            apiKey: settings.apiKey.trim(),
            model: settings.model.trim(),
            mode: STATIC_EXPORT ? 'direct' : settings.mode,
            includeConfigs: settings.includeConfigs,
        };
    }

    function updatePreset(id: string) {
        setPresetId(id);
        const preset = AI_PRESETS.find(p => p.id === id);
        if (preset && preset.id !== 'custom') {
            setSettings(s => ({
                ...s,
                baseUrl: preset.baseUrl,
                model: preset.model,
            }));
        }
    }

    function updateField<K extends keyof AiSettings>(
        key: K,
        value: AiSettings[K]
    ) {
        setSettings(s => ({ ...s, [key]: value }));
        if (key === 'baseUrl')
            setPresetId(presetFor({ ...settings, baseUrl: value as string }));
    }

    async function run() {
        const resolved = resolveSettings();
        if (!resolved.baseUrl || !resolved.model || !resolved.apiKey) {
            setError(t('ai.errorConfig'));
            return;
        }

        saveAiSettings(resolved);
        setSettings(resolved);
        setError('');
        setRawPreview('');
        setUsage(undefined);
        setAnalysis('');
        setConversation([]);
        setQuestion('');
        setPending('');
        setRunning(true);
        setAsking(false);

        const controller = new AbortController();
        abortRef.current = controller;
        try {
            await streamAiAnalysis({
                settings: resolved,
                messages: buildAiMessages(data, i18n.language, {
                    includeConfigs: resolved.includeConfigs,
                }),
                onChunk: chunk => setAnalysis(prev => prev + chunk),
                onUsage: u => setUsage(u),
                signal: controller.signal,
            });
        } catch (err) {
            const e = err as Error;
            if (e.name === 'AbortError') {
                // user pressed stop - not an error
            } else if (e.name === 'EmptyResponseError') {
                const empty = e as EmptyResponseError;
                setRawPreview(empty.raw);
                setError(
                    empty.hadReasoning
                        ? t('ai.reasonerOnly')
                        : t('ai.emptyResponse')
                );
            } else if (e.name === 'DirectNetworkError') {
                setError(t('ai.directFailed', { message: e.message }));
            } else {
                setError(
                    t('ai.error', {
                        message: e.message || String(err),
                    })
                );
            }
        } finally {
            setRunning(false);
            setAsking(false);
            abortRef.current = undefined;
        }
    }

    async function ask() {
        const q = question.trim();
        if (!q || running) return;
        const resolved = resolveSettings();
        const history = conversation;
        setQuestion('');
        setError('');
        setRawPreview('');
        setPending('');
        setConversation([...history, { role: 'user', content: q }]);
        setRunning(true);
        setAsking(true);

        const controller = new AbortController();
        abortRef.current = controller;
        let answer = '';
        try {
            await streamAiAnalysis({
                settings: resolved,
                messages: buildFollowUpMessages(
                    data,
                    i18n.language,
                    { includeConfigs: resolved.includeConfigs },
                    analysis,
                    history,
                    q
                ),
                onChunk: chunk => {
                    answer += chunk;
                    setPending(answer);
                },
                onUsage: u => setUsage(u),
                signal: controller.signal,
            });
            if (answer.trim()) {
                setConversation([
                    ...history,
                    { role: 'user', content: q },
                    { role: 'assistant', content: answer },
                ]);
            } else {
                setConversation(history);
                setError(t('ai.emptyResponse'));
            }
        } catch (err) {
            setConversation(history);
            const e = err as Error;
            if (e.name === 'AbortError') {
                // user pressed stop - not an error
            } else if (e.name === 'EmptyResponseError') {
                const empty = e as EmptyResponseError;
                setRawPreview(empty.raw);
                setError(
                    empty.hadReasoning
                        ? t('ai.reasonerOnly')
                        : t('ai.emptyResponse')
                );
            } else if (e.name === 'DirectNetworkError') {
                setError(t('ai.directFailed', { message: e.message }));
            } else {
                setError(
                    t('ai.error', {
                        message: e.message || String(err),
                    })
                );
            }
        } finally {
            setPending('');
            setRunning(false);
            setAsking(false);
            abortRef.current = undefined;
        }
    }

    function stop() {
        abortRef.current?.abort();
    }

    async function copy() {
        const text = [
            analysis,
            ...conversation.map(m =>
                m.role === 'user' ? `## ${m.content}` : m.content
            ),
        ]
            .filter(Boolean)
            .join('\n\n');
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // clipboard unavailable
        }
    }

    return (
        <TextBox extraClassName={styles['ai-panel']}>
            <div className={styles['ai-header']}>
                <span className={styles['ai-title']}>
                    <FontAwesomeIcon icon={faRobot} /> {t('ai.title')}
                </span>
                <span className={styles['ai-header-buttons']}>
                    {(analysis || conversation.length > 0) && !running && (
                        <button type="button" onClick={copy}>
                            <FontAwesomeIcon icon={faCopy} />{' '}
                            {copied ? t('ai.copied') : t('ai.copy')}
                        </button>
                    )}
                    <button type="button" onClick={onClose}>
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </span>
            </div>

            <div className={styles['ai-config']}>
                <label>
                    <span>{t('ai.provider')}</span>
                    <select
                        value={presetId}
                        onChange={e => updatePreset(e.target.value)}
                    >
                        {AI_PRESETS.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    <span>{t('ai.requestMode')}</span>
                    <select
                        value={STATIC_EXPORT ? 'direct' : settings.mode}
                        onChange={e =>
                            updateField('mode', e.target.value as AiRequestMode)
                        }
                    >
                        <option value="direct">{t('ai.modeDirect')}</option>
                        {!STATIC_EXPORT && (
                            <option value="proxy">{t('ai.modeProxy')}</option>
                        )}
                    </select>
                </label>
                <label>
                    <span>{t('ai.baseUrl')}</span>
                    <input
                        type="text"
                        value={settings.baseUrl}
                        placeholder="https://api.openai.com/v1"
                        onChange={e => updateField('baseUrl', e.target.value)}
                    />
                </label>
                <label>
                    <span>{t('ai.model')}</span>
                    <input
                        type="text"
                        value={settings.model}
                        placeholder="gpt-4o-mini"
                        onChange={e => updateField('model', e.target.value)}
                    />
                </label>
                <label>
                    <span>{t('ai.apiKey')}</span>
                    <input
                        type="password"
                        value={settings.apiKey}
                        placeholder={t('ai.apiKeyPlaceholder')}
                        autoComplete="off"
                        onChange={e => updateField('apiKey', e.target.value)}
                    />
                </label>
            </div>
            <label className={styles['ai-toggle']}>
                <input
                    type="checkbox"
                    checked={settings.includeConfigs}
                    onChange={e =>
                        updateField('includeConfigs', e.target.checked)
                    }
                />
                <span>
                    {t('ai.sendConfigs')}
                    <small>{t('ai.configWarning')}</small>
                </span>
            </label>
            <p className={styles['ai-note']}>{t('ai.keyNote')}</p>

            <div className={styles['ai-run']}>
                <button type="button" onClick={run} disabled={running}>
                    <FontAwesomeIcon icon={faPlay} />{' '}
                    {running && !asking
                        ? t('ai.running')
                        : analysis
                          ? t('ai.rerun')
                          : t('ai.run')}
                </button>
                {running && (
                    <button type="button" onClick={stop}>
                        <FontAwesomeIcon icon={faStop} /> {t('ai.stop')}
                    </button>
                )}
                {error && <span className={styles['ai-error']}>{error}</span>}
                {rawPreview && (
                    <details className={styles['ai-raw']}>
                        <summary>{t('ai.rawLabel')}</summary>
                        <pre>{rawPreview}</pre>
                    </details>
                )}
            </div>

            <div className={styles['ai-output']} ref={outputRef}>
                {!analysis && !error && (
                    <p className={styles['ai-placeholder']}>
                        {running ? t('ai.thinking') : t('ai.placeholder')}
                    </p>
                )}
                {report && (
                    <AiReportView report={report} data={data} usage={usage} />
                )}
                {!report && analysis && (
                    <>
                        {running && !asking ? (
                            <pre className={styles['ai-streaming']}>
                                {analysis}
                            </pre>
                        ) : (
                            <AiMarkdown text={analysis} />
                        )}
                    </>
                )}
                {conversation.map((m, i) =>
                    m.role === 'user' ? (
                        <p key={i} className={styles['ai-question']}>
                            {m.content}
                        </p>
                    ) : (
                        <AiMarkdown key={i} text={m.content} />
                    )
                )}
                {pending && (
                    <pre className={styles['ai-streaming']}>{pending}</pre>
                )}
                {running && !asking && analysis && !report && (
                    <span className={styles['ai-cursor']} />
                )}
                {running && asking && <span className={styles['ai-cursor']} />}
            </div>

            {report && (
                <form
                    className={styles['ai-ask']}
                    onSubmit={e => {
                        e.preventDefault();
                        void ask();
                    }}
                >
                    <input
                        type="text"
                        value={question}
                        placeholder={t('ai.askPlaceholder')}
                        disabled={running}
                        onChange={e => setQuestion(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={running || !question.trim()}
                    >
                        <FontAwesomeIcon icon={faPaperPlane} />{' '}
                        {asking ? t('ai.asking') : t('ai.send')}
                    </button>
                </form>
            )}
        </TextBox>
    );
}
