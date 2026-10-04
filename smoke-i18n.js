const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({
        channel: 'chrome',
        headless: true,
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    const issues = [];
    page.on('console', m => {
        const text = m.text();
        if (/not found|i18next|missing/i.test(text)) issues.push(text);
    });
    page.on('pageerror', e => issues.push('pageerror: ' + e.message));

    const assert = (cond, msg) => {
        if (!cond) {
            console.error('FAIL: ' + msg);
            process.exitCode = 1;
        } else {
            console.log('ok: ' + msg);
        }
    };
    const lang = () => page.getAttribute('html', 'lang');

    // --- initial load (browser locale may be en or zh) ---
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const initialLang = await lang();
    assert(
        initialLang === 'en' || initialLang === 'zh-CN',
        'initial lang is a known locale: ' + initialLang
    );
    const initialBody = await page.textContent('body');
    assert(
        initialLang === 'zh-CN'
            ? /性能分析|关于/.test(initialBody)
            : initialBody.includes('About'),
        `initial content matches locale (${initialLang})`
    );

    // --- toggle flips language ---
    await page.click(
        'button[title*="Switch language"], button[title*="切换语言"]'
    );
    await page.waitForTimeout(500);
    const afterLang = await lang();
    const afterBody = await page.textContent('body');
    assert(
        afterLang !== initialLang,
        `toggle flips lang: ${initialLang} -> ${afterLang}`
    );
    assert(
        afterLang === 'zh-CN'
            ? /性能分析|关于/.test(afterBody)
            : afterBody.includes('About'),
        'toggled content matches new locale'
    );

    // --- force zh-CN via localStorage, check several pages ---
    await context.addInitScript(() =>
        window.localStorage.setItem('spark.locale', 'zh-CN')
    );
    for (const [route, expect] of [
        ['/', /性能分析|关于/],
        ['/download', /下载/],
        ['/changelog', /更新日志|提交/],
        ['/some/nonexistent/page', /页面不存在/],
    ]) {
        await page.goto('http://localhost:3000' + route, {
            waitUntil: 'networkidle',
        });
        await page.waitForTimeout(500);
        const body = await page.textContent('body');
        assert(expect.test(body), `zh content on ${route}`);
        assert((await lang()) === 'zh-CN', `zh lang on ${route}`);
    }
    await page.goto('http://localhost:3000/download', {
        waitUntil: 'networkidle',
    });
    await page.waitForTimeout(300);
    assert(
        (await page.title()).includes('下载'),
        'document title localized: ' + (await page.title())
    );

    // --- back to English via toggle ---
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    await page.click(
        'button[title*="Switch language"], button[title*="切换语言"]'
    );
    await page.waitForTimeout(500);
    const enBody = await page.textContent('body');
    assert(enBody.includes('About'), 'toggle back to English works');

    console.log(
        issues.length
            ? '\nconsole issues:\n' + issues.join('\n')
            : '\nno i18n console issues'
    );
    await browser.close();
})();
