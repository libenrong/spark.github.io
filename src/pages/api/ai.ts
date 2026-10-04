import type { NextApiRequest, NextApiResponse } from 'next';

export interface AiChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface AiRequestBody {
    baseUrl: string;
    apiKey: string;
    model: string;
    messages: AiChatMessage[];
}

const MAX_MESSAGE_CHARS = 100_000;

function isSafeBaseUrl(baseUrl: string): boolean {
    try {
        const url = new URL(baseUrl);
        return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
        return false;
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const body = req.body as Partial<AiRequestBody> | undefined;
    const baseUrl = typeof body?.baseUrl === 'string' ? body.baseUrl : '';
    const apiKey = typeof body?.apiKey === 'string' ? body.apiKey : '';
    const model = typeof body?.model === 'string' ? body.model : '';
    const messages = body?.messages;

    if (!isSafeBaseUrl(baseUrl)) {
        res.status(400).json({ error: 'Invalid API base URL' });
        return;
    }
    if (!apiKey || !model) {
        res.status(400).json({ error: 'Missing API key or model' });
        return;
    }
    if (
        !Array.isArray(messages) ||
        messages.length === 0 ||
        messages.length > 10 ||
        messages.some(
            m =>
                !m ||
                typeof m.content !== 'string' ||
                m.content.length > MAX_MESSAGE_CHARS
        )
    ) {
        res.status(400).json({ error: 'Invalid messages' });
        return;
    }

    const url = baseUrl.replace(/\/+$/, '') + '/chat/completions';

    let upstream: globalThis.Response;
    try {
        upstream = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages,
                stream: true,
                stream_options: { include_usage: true },
                temperature: 0.4,
                max_tokens: 8192,
            }),
            signal: AbortSignal.timeout(120_000),
        });
    } catch (err) {
        res.status(502).json({
            error: 'Failed to reach the API endpoint',
            detail: err instanceof Error ? err.message : String(err),
        });
        return;
    }

    if (!upstream.ok || !upstream.body) {
        const detail = await upstream
            .text()
            .catch(() => '')
            .then(text => text.slice(0, 2000));
        res.status(upstream.status).json({
            error: `API request failed (HTTP ${upstream.status})`,
            detail,
        });
        return;
    }

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const reader = upstream.body.getReader();
    try {
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            if (!res.write(Buffer.from(value))) {
                // wait for the socket to drain
                await new Promise<void>(resolve => res.once('drain', resolve));
            }
        }
    } catch {
        // client disconnected or upstream aborted - nothing to do
    } finally {
        res.end();
    }
}
