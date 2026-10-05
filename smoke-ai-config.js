const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
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
    const readReq = () =>
        JSON.parse(fs.readFileSync('/tmp/mock-llm-req.json', 'utf8'));
    const userContent = req =>
        req.messages.find(m => m.role === 'user').content;

    await page.goto('http://localhost:3000/IoDMj8UrqZ', {
        waitUntil: 'domcontentloaded',
    });
    await page.waitForSelector('div[title*="AI 分析此报告"]', { timeout: 60000 });
    await page.click('div[title*="AI 分析此报告"]');
    await page.waitForSelector('[class*="ai-config"]', { timeout: 10000 });

    await page
        .getByPlaceholder('https://api.openai.com/v1')
        .fill('http://localhost:8081/v1');
    await page.getByPlaceholder('gpt-4o-mini').fill('report-model');
    await page.getByPlaceholder('sk-…').fill('sk-test-123');

    // 1. toggle defaults to off
    const toggle = page.locator('[class*="ai-toggle"] input[type="checkbox"]');
    assert((await toggle.count()) === 1, 'config toggle present');
    assert(!(await toggle.isChecked()), 'config toggle default off');

    // 2. run with configs off -> summary must NOT contain configurations
    await page.locator('[class*="ai-run"] button').first().click();
    await page.waitForSelector('[class*="ai-report"]', { timeout: 30000 });
    await page.waitForSelector('button:has-text("复制")', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 300));
    let req = readReq();
    assert(
        !userContent(req).includes('"configurations"'),
        'configs off: configurations not sent'
    );
    let reportText = await page.textContent('[class*="ai-report"]');
    assert(
        !reportText.includes('配置修改建议'),
        'configs off: no config suggestion section'
    );

    // 3. enable the toggle and re-run
    await toggle.check();
    await page.locator('[class*="ai-run"] button').first().click();
    await page.waitForSelector('text=配置修改建议', { timeout: 30000 });
    await page.waitForSelector('button:has-text("复制")', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 300));
    req = readReq();
    const user = userContent(req);
    assert(
        user.includes('"configurations"'),
        'configs on: configurations section sent'
    );
    const summary = JSON.parse(user.slice(user.indexOf('{')));
    const configKeys = Object.keys(summary.configurations || {});
    assert(configKeys.length > 0, 'config files included: ' + configKeys.length);
    console.log('    config files:', JSON.stringify(configKeys.slice(0, 6)));

    // 4. suggestion card rendered with file / key / change
    reportText = await page.textContent('[class*="ai-report"]');
    assert(reportText.includes('server.properties'), 'suggestion file shown');
    assert(reportText.includes('max-tick-time'), 'suggestion key shown');
    assert(reportText.includes('60000'), 'suggested value shown');
    assert(reportText.includes('原因'), 'reason label shown');

    // 5. persisted
    const stored = await page.evaluate(() =>
        window.localStorage.getItem('spark.llm')
    );
    assert(
        stored && stored.includes('"includeConfigs":true'),
        'includeConfigs persisted'
    );

    console.log(
        issues.length
            ? '\nconsole issues:\n' + issues.join('\n')
            : '\nno console errors'
    );
    await browser.close();
})();
