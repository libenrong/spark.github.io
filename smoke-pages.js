const { chromium } = require('playwright');
const BASE = process.env.SMOKE_BASE || 'http://localhost:4173';
const BPATH = process.env.SMOKE_BPATH || '/spark-viewer';
(async () => {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await context.addInitScript(() => {
        window.localStorage.setItem('spark.locale', 'zh-CN');
    });
    const page = await context.newPage();
    const issues = [];
    page.on('pageerror', e => issues.push('pageerror: ' + e.message));
    page.on('console', m => {
        if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) issues.push('console: ' + m.text());
    });
    const assert = (cond, msg) => {
        if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; }
        else console.log('ok: ' + msg);
    };

    // 1. direct load of a profile code (404.html SPA fallback)
    await page.goto(`${BASE}${BPATH}/IoDMj8UrqZ`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('div[title*="AI 分析此报告"]', { timeout: 60000 });
    assert(true, 'direct code URL: viewer rendered via 404 fallback');
    const bodyText = await page.textContent('body');
    assert(/Rcon|采样间隔/.test(bodyText), 'profile content rendered');
    const favicon = await page.getAttribute('link[rel="shortcut icon"]', 'href');
    assert(favicon === `${BPATH}/assets/logo-inverted-512.png`, 'favicon basePath: ' + favicon);

    // 2. homepage + docs link
    await page.goto(`${BASE}${BPATH}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('nav', { timeout: 15000 });
    const docsHref = await page.getAttribute('nav a:nth-child(2)', 'href');
    assert(/^https:\/\/spark-docs/.test(docsHref), 'docs absolute: ' + docsHref);

    // 3. internal nav
    await page.click('nav a:first-child');
    await page.waitForURL('**/download', { timeout: 10000 });
    assert(page.url().endsWith(`${BPATH}/download`), 'nav to download');

    // 4. multi-segment unknown -> not found
    await page.goto(`${BASE}${BPATH}/foo/bar`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    const nf = await page.textContent('body');
    assert(/404/.test(nf), 'not found for multi-segment path');

    // 5. AI panel: mode select (2nd select) has no proxy option
    await page.goto(`${BASE}${BPATH}/IoDMj8UrqZ`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('div[title*="AI 分析此报告"]', { timeout: 60000 });
    await page.click('div[title*="AI 分析此报告"]');
    await page.waitForSelector('[class*="ai-config"]', { timeout: 10000 });
    const modeOptions = await page.locator('[class*="ai-config"] select').nth(1).locator('option').allTextContents();
    assert(modeOptions.length === 1, 'proxy option hidden: ' + JSON.stringify(modeOptions));
    await page.getByPlaceholder('https://api.openai.com/v1').fill('http://localhost:8081/v1');
    await page.getByPlaceholder('gpt-4o-mini').fill('report-model');
    await page.getByPlaceholder('sk-…').fill('sk-test-123');
    await page.locator('[class*="ai-run"] button').first().click();
    await page.waitForSelector('[class*="ai-report"]', { timeout: 30000 });
    const reportTxt = await page.textContent('[class*="ai-report"]');
    assert(reportTxt.includes('总体结论'), 'AI direct works on static export');
    await page.waitForSelector('button:has-text("复制")', { timeout: 15000 });
    assert(true, 'AI stream finished');

    console.log(issues.length ? 'console issues:\n' + issues.join('\n') : 'no console errors');
    await browser.close();
})();
