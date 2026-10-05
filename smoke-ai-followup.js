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

    // 1. run the initial analysis
    await page.locator('[class*="ai-run"] button').first().click();
    await page.waitForSelector('[class*="ai-report"]', { timeout: 30000 });
    await page.waitForSelector('button:has-text("复制")', { timeout: 15000 });
    assert(true, 'initial structured report rendered');

    // 2. ask box appears
    const askInput = page.locator('[class*="ai-ask"] input');
    assert((await askInput.count()) === 1, 'follow-up input present');
    assert(
        (await page.locator('[class*="ai-ask"] button').count()) === 1,
        'follow-up send button present'
    );

    // 3. ask a follow-up
    const question = '怎么降低 MSPT？';
    await askInput.fill(question);
    await page.locator('[class*="ai-ask"] button').click();

    // question bubble + streamed answer
    await page.waitForSelector(`[class*="ai-question"]:has-text("${question}")`, {
        timeout: 15000,
    });
    assert(true, 'user question bubble rendered');
    await page.waitForSelector('text=针对你的追问', { timeout: 30000 });
    assert(true, 'follow-up answer rendered');
    await page.waitForSelector('button:has-text("复制")', { timeout: 15000 });

    // 4. report card is still present above the Q&A
    assert(
        (await page.locator('[class*="ai-report"]').count()) === 1,
        'report card kept after follow-up'
    );

    // 5. request carried the conversation context
    await new Promise(r => setTimeout(r, 300));
    const req = readReq();
    const msgs = req.messages;
    const system = msgs.find(m => m.role === 'system').content;
    assert(
        /Markdown/.test(system) && /Do NOT output JSON/.test(system),
        'follow-up system prompt asks for markdown'
    );
    const assistant = msgs.find(m => m.role === 'assistant');
    assert(
        !!assistant && assistant.content.trim().startsWith('{'),
        'prior structured analysis included as assistant message'
    );
    assert(
        msgs[msgs.length - 1].role === 'user' &&
            msgs[msgs.length - 1].content === question,
        'new question is the last message'
    );
    const userSummary = msgs[1];
    assert(
        userSummary.role === 'user' &&
            userSummary.content.includes('Profile summary'),
        'profile summary included once'
    );
    assert(msgs.length >= 4, 'conversation messages present: ' + msgs.length);

    // 6. token usage bar reflects the follow-up completion
    const tokens = await page.textContent('[class*="ai-tokens"]');
    assert(tokens.includes('1500'), 'token bar updated to follow-up usage');

    console.log(
        issues.length
            ? '\nconsole issues:\n' + issues.join('\n')
            : '\nno console errors'
    );
    await browser.close();
})();
