import {
    faCopy,
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
    AiRequestMode,
    AiSettings,
    AiUsage,
    buildAiMessages,
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
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [rawPreview, setRawPreview] = useState('');
    const [usage, setUsage] = useState<AiUsage | undefined>(undefined);
    const [copied, setCopied] = useState(false);
    const abortRef = useRef<AbortController | undefined>(undefined);
    const outputRef = useRef<HTMLDivElement>(null);

    // structured report view once the streamed JSON becomes parseable
    const report = useMemo(
        () => (output ? parseAiReport(output) : undefined),
        [output]
    );

    // abort any in-flight request when the panel unmounts
    useEffect(() => () => abortRef.current?.abort(), []);

    // keep the streamed output scrolled to the bottom
    useEffect(() => {
        const el = outputRef.current;
        if (el && running) el.scrollTop = el.scrollHeight;
    }, [output, running]);

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
        const resolved: AiSettings = {
            baseUrl: settings.baseUrl.trim(),
            apiKey: settings.apiKey.trim(),
            model: settings.model.trim(),
            mode: STATIC_EXPORT ? 'direct' : settings.mode,
        };
        if (!resolved.baseUrl || !resolved.model || !resolved.apiKey) {
            setError(t('ai.errorConfig'));
            return;
        }

        saveAiSettings(resolved);
        setSettings(resolved);
        setError('');
        setRawPreview('');
        setUsage(undefined);
        setOutput('');
        setRunning(true);

        const controller = new AbortController();
        abortRef.current = controller;
        try {
            await streamAiAnalysis({
                settings: resolved,
                messages: buildAiMessages(data, i18n.language),
                onChunk: chunk => setOutput(prev => prev + chunk),
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
            abortRef.current = undefined;
        }
    }

    function stop() {
        abortRef.current?.abort();
    }

    async function copy() {
        try {
            await navigator.clipboard.writeText(output);
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
                    {output && !running && (
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
            <p className={styles['ai-note']}>{t('ai.keyNote')}</p>

            <div className={styles['ai-run']}>
                <button type="button" onClick={run} disabled={running}>
                    <FontAwesomeIcon icon={faPlay} />{' '}
                    {running
                        ? t('ai.running')
                        : output
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
                {!output && !error && (
                    <p className={styles['ai-placeholder']}>
                        {running ? t('ai.thinking') : t('ai.placeholder')}
                    </p>
                )}
                {report && (
                    <AiReportView report={report} data={data} usage={usage} />
                )}
                {!report && output && (
                    <>
                        {running ? (
                            <pre className={styles['ai-streaming']}>
                                {output}
                            </pre>
                        ) : (
                            <AiMarkdown text={output} />
                        )}
                    </>
                )}
                {running && output && <span className={styles['ai-cursor']} />}
            </div>
        </TextBox>
    );
}
