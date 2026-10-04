const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({
        channel: 'chrome',
        headless: true,
    });
    const context = await browser.newContext();
    await context.addInitScript(() => {
        window.localStorage.setItem('spark.locale', 'zh-CN');
        window.localStorage.removeItem('spark.llm');
    });
    const page = await context.newPage();
    const issues = [];
    page.on('pageerror', e => issues.push('pageerror: ' + e.message));
    page.on('console', m => {
        if (m.type() === 'error' && !/Failed to load resource/.test(m.text()))
            issues.push('console: ' + m.text());
    });

    const assert = (cond, msg) => {
        if (!cond) {
            console.error('FAIL: ' + msg);
            process.exitCode = 1;
        } else {
            console.log('ok: ' + msg);
        }
    };

    // 1. open a real profile
    await page.goto('http://localhost:3000/IoDMj8UrqZ', {
        waitUntil: 'domcontentloaded',
    });
    await page.waitForSelector('div[title*="AI 分析此报告"]', {
        timeout: 60000,
    });
    assert(true, 'profile loaded, AI button present');

    // 2. open the panel
    await page.click('div[title*="AI 分析此报告"]');
    await page.waitForSelector('text=AI 分析', { timeout: 10000 });
    assert(true, 'AI panel opens');
    const treeWrapperHidden = await page.evaluate(() => {
        const av = document.querySelector('.allview');
        return !!av && av.parentElement?.style.display === 'none';
    });
    assert(treeWrapperHidden, 'main view hidden while panel open');

    // 3. missing-key validation (key removed in init script)
    await page.click('button:has-text("开始分析")');
    await page.waitForSelector('text=请先填写', { timeout: 5000 });
    assert(true, 'missing config validation shown');

    // 4. fill in mock endpoint + run (default mode = direct browser call)
    await page
        .getByPlaceholder('https://api.openai.com/v1')
        .fill('http://localhost:8081/v1');
    await page.getByPlaceholder('gpt-4o-mini').fill('demo-model');
    await page.getByPlaceholder('sk-…').fill('sk-test-123');
    await page.locator('[class*="ai-run"] button').first().click();
    await page.waitForSelector('text=服务器整体状况', { timeout: 30000 });
    assert(true, 'direct mode: streamed analysis rendered');

    // wait for streaming to finish (copy button appears once running=false)
    await page.waitForSelector('button:has-text("复制")', { timeout: 15000 });
    assert(true, 'stream finished, copy button appears');

    // markdown rendering
    const md = await page.textContent('[class*="ai-md"]');
    assert(/良好/.test(md), 'bold text rendered: ' + md.slice(0, 60));
    const codeBlock = await page.$('pre code');
    assert(!!codeBlock, 'code fence rendered');
    const quote = await page.$('blockquote');
    assert(!!quote, 'blockquote rendered');
    const headings = await page.$$('h2, h3, h4');
    assert(headings.length >= 1, 'heading rendered');

    // 5. mock server received a sane summary
    await new Promise(r => setTimeout(r, 500));
    const raw = fs.readFileSync('/tmp/mock-llm-req.json', 'utf8');
    const req = JSON.parse(raw);
    assert(req.model === 'demo-model', 'model forwarded');
    assert(
        req.headers !== undefined || req.messages !== undefined,
        'messages present'
    );
    const user = req.messages.find(m => m.role === 'user').content;
    assert(user.includes('Profile summary'), 'summary sent as user message');
    assert(user.includes('"hotspots"'), 'summary contains hotspots section');
    assert(user.includes('"game"'), 'summary contains game stats');
    assert(user.includes('"system"'), 'summary contains system stats');
    assert(raw.length < 70000, 'summary size sane: ' + raw.length + ' bytes');
    const summary = JSON.parse(user.slice(user.indexOf('{')));
    assert(
        Array.isArray(summary.hotspots.methodsByTotalTime) &&
            summary.hotspots.methodsByTotalTime.length > 0,
        'hot methods extracted: ' +
            (summary.hotspots.methodsByTotalTime || []).length
    );
    console.log(
        '    summary sample:',
        JSON.stringify(
            summary.hotspots.methodsByTotalTime?.slice(0, 3),
            null,
            0
        ).slice(0, 300)
    );
    console.log(
        '    top thread:',
        JSON.stringify(summary.hotspots.threads?.[0])
    );

    // 6. switch to proxy mode and re-run through /api/ai
    await page
        .locator('[class*="ai-config"] select')
        .nth(1)
        .selectOption('proxy');
    await page.locator('[class*="ai-run"] button').first().click();
    await page.waitForSelector('text=服务器整体状况', { timeout: 30000 });
    await page.waitForSelector('button:has-text("复制")', { timeout: 15000 });
    assert(true, 'proxy mode: streamed analysis rendered');

    // 6b. empty content → explicit error + raw response preview
    await page.getByPlaceholder('gpt-4o-mini').fill('empty-model');
    await page.locator('[class*="ai-run"] button').first().click();
    await page.waitForSelector(
        '[class*="ai-error"]:has-text("没有返回任何内容")',
        {
            timeout: 30000,
        }
    );
    assert(true, 'empty response shows explicit error');
    const rawDetails = await page.$('[class*="ai-raw"] summary');
    assert(!!rawDetails, 'raw response preview available');
    const rawText = await page.textContent('[class*="ai-raw"]');
    assert(rawText.includes('data:'), 'raw preview contains stream data');

    // 6c. reasoning-only response → reasoner hint
    await page.getByPlaceholder('gpt-4o-mini').fill('reasoner-model');
    await page.locator('[class*="ai-run"] button').first().click();
    await page.waitForSelector('[class*="ai-error"]:has-text("思考过程")', {
        timeout: 30000,
    });
    assert(true, 'reasoning-only response shows reasoner hint');

    // 6d. non-SSE JSON body → fallback parse
    await page.getByPlaceholder('gpt-4o-mini').fill('json-model');
    await page.locator('[class*="ai-run"] button').first().click();
    await page.waitForSelector('text=非流式响应解析', { timeout: 30000 });
    assert(true, 'non-streaming JSON body parsed via fallback');

    // 6e. structured JSON report → card UI
    await page.getByPlaceholder('gpt-4o-mini').fill('report-model');
    await page.locator('[class*="ai-run"] button').first().click();
    await page.waitForSelector('[class*="ai-report"]', { timeout: 30000 });
    assert(true, 'structured report renders card view');
    const reportText = await page.textContent('[class*="ai-report"]');
    assert(
        reportText.includes('总体结论'),
        'overall conclusion section present'
    );
    assert(reportText.includes('MSPT 尖峰'), 'diagnosis title rendered');
    assert(reportText.includes('优先处理'), 'recommendations section present');
    assert(
        reportText.includes('未命中输入') && reportText.includes('300'),
        'token usage bar shows uncached input'
    );
    assert(
        reportText.includes('缓存命中率') && reportText.includes('75.0%'),
        'cache hit rate computed from usage frame'
    );
    const stepCount = await page.$$eval(
        '[class*="ai-steps"] li',
        els => els.length
    );
    assert(stepCount >= 3, 'recommendation steps rendered: ' + stepCount);
    const mdInReport = await page.$('[class*="ai-md"]');
    assert(!mdInReport, 'markdown fallback not used for valid report');
    const gcSection = reportText.includes('垃圾回收');
    console.log('    gc section present: ' + gcSection);
    await page.waitForSelector('button:has-text("复制")', { timeout: 15000 });
    assert(true, 'report stream finished, copy button appears');

    // 7. close panel restores tree
    await page.click('[class*="ai-header-buttons"] button:last-child');
    await page.waitForTimeout(300);
    const treeWrapperVisible = await page.evaluate(() => {
        const av = document.querySelector('.allview');
        return !!av && av.parentElement?.style.display !== 'none';
    });
    assert(treeWrapperVisible, 'main view restored after close');

    // 8. error path via proxy: unreachable endpoint
    await page.click('div[title*="AI 分析此报告"]');
    await page.waitForSelector('text=AI 分析', { timeout: 5000 });
    await page
        .getByPlaceholder('https://api.openai.com/v1')
        .fill('http://localhost:9/v1');
    await page.locator('[class*="ai-run"] button').first().click();
    await page.waitForSelector('[class*="ai-error"]', { timeout: 30000 });
    let errText = await page.textContent('[class*="ai-error"]');
    assert(/分析失败/.test(errText), 'proxy error shown: ' + errText);

    // 9. error path via direct: expect CORS/network hint
    await page
        .locator('[class*="ai-config"] select')
        .nth(1)
        .selectOption('direct');
    await page.locator('[class*="ai-run"] button').first().click();
    await page.waitForSelector('[class*="ai-error"]', { timeout: 30000 });
    await page.waitForSelector('[class*="ai-error"]:has-text("经本站代理")', {
        timeout: 30000,
    });
    errText = await page.textContent('[class*="ai-error"]');
    assert(
        /经本站代理/.test(errText),
        'direct network error shows proxy hint: ' + errText.slice(0, 120)
    );

    // 10. settings persisted
    const stored = await page.evaluate(() =>
        window.localStorage.getItem('spark.llm')
    );
    assert(
        stored && stored.includes('localhost:9'),
        'settings persisted to localStorage'
    );

    console.log(
        issues.length
            ? '\nconsole issues:\n' + issues.join('\n')
            : '\nno console errors'
    );
    await browser.close();
})();
