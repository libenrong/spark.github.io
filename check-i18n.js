#!/usr/bin/env node
/* Verifies that every i18n key referenced in src/ exists in the catalogs. */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'src');
const NS = ['common', 'pages', 'metadata', 'widgets', 'metrics', 'sampler', 'heap', 'health'];

const catalogs = {};
for (const loc of ['en', 'zh-CN']) {
    catalogs[loc] = {};
    for (const ns of NS) {
        catalogs[loc][ns] = JSON.parse(
            fs.readFileSync(
                path.join(__dirname, 'src/i18n/locales', loc, ns + '.json'),
                'utf8'
            )
        );
    }
}

function flatten(obj, prefix = '', out = new Set()) {
    for (const [k, v] of Object.entries(obj)) {
        const key = prefix ? prefix + '.' + k : k;
        if (v && typeof v === 'object') flatten(v, key, out);
        else out.add(key);
    }
    return out;
}

const flat = {};
for (const loc of ['en', 'zh-CN']) {
    flat[loc] = {};
    for (const ns of NS) flat[loc][ns] = flatten(catalogs[loc][ns]);
}

function* walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) yield* walk(p);
        else if (/\.(ts|tsx)$/.test(entry.name)) yield p;
    }
}

const missing = [];
const dynamic = [];
const seen = new Set();

for (const file of walk(ROOT)) {
    if (file.includes(path.join('i18n', 'locales'))) continue;
    const src = fs.readFileSync(file, 'utf8');
    const rel = path.relative(__dirname, file);

    // alias → namespace map (const { t } = useTranslation('common') / { t: tp })
    const aliases = new Map();
    for (const m of src.matchAll(
        /\{([^}]*)\}\s*=\s*useTranslation\(\s*['"]([\w-]+)['"]/g
    )) {
        for (const part of m[1].split(',')) {
            const am = part.trim().match(/^(\w+)\s*(?::\s*(\w+))?$/);
            if (am) aliases.set(am[2] || am[1], m[2]);
        }
    }

    const defaultNs = aliases.get('t') || null;

    // ns= prop on <Trans ...> tags (best effort: last ns= seen before the key)
    function nsBefore(idx) {
        const before = src.slice(0, idx);
        const m = [...before.matchAll(/\bns=["']([\w-]+)["']/g)];
        return m.length ? m[m.length - 1][1] : null;
    }

    function check(rel, ns, key, loc) {
        const keys = flat[loc][ns];
        return keys.has(key) || keys.has(key + '_other') || keys.has(key + '_one');
    }

    function report(rel, ns, key) {
        const inAny = NS.filter(n =>
            ['en', 'zh-CN'].every(loc => check(rel, n, key, loc))
        );
        if (inAny.length === 0) {
            missing.push(`${rel}: missing ${ns || '?'}:${key}`);
        } else if (ns && !inAny.includes(ns)) {
            missing.push(
                `${rel}: key "${key}" not in ns "${ns}" (found in: ${inAny.join(', ')})`
            );
        }
        seen.add((ns || '?') + ':' + key);
    }

    const patterns = [
        // identifier('key') — covers t(), tp(), aliased translators
        /\b([A-Za-z_$][\w$]*)\(\s*['"]([^'"]+)['"]/g,
        // i18nKey="key" / i18nKey={'key'}
        /\bi18nKey=(?:\{\s*['"]([^'"]+)['"]\s*\}|["']([^"']+)["'])/g,
        // i18n.t('ns:key')
        /\bi18n\.t\(\s*['"]([\w-]+):([^'"]+)['"]/g,
    ];

    for (let i = 0; i < patterns.length; i++) {
        for (const m of src.matchAll(patterns[i])) {
            let ns, key;
            if (i === 2) {
                ns = m[1];
                key = m[2];
            } else if (i === 1) {
                key = m[1] || m[2];
                if (!key || key.includes('${')) continue;
                ns = nsBefore(m.index) || defaultNs;
            } else {
                const fn = m[1];
                key = m[2];
                if (key.includes('${') || key.includes('{{')) {
                    dynamic.push(`${rel}: ${fn}('${key}')`);
                    continue;
                }
                // only consider known translator aliases / bare t
                ns = aliases.get(fn);
                if (!ns && fn !== 't' && fn !== 'tp') continue;
                if (!ns) ns = defaultNs;
            }
            if (!ns && i !== 1) ns = defaultNs;
            if (!key) continue;
            if (key.includes(':')) {
                const [a, b] = key.split(':');
                if (NS.includes(a)) {
                    ns = a;
                    key = b;
                }
            }
            report(rel, ns, key);
        }
    }
}

console.log(`checked ${seen.size} distinct keys`);
if (dynamic.length) {
    console.log(`\ndynamic keys (verify manually):`);
    for (const d of [...new Set(dynamic)]) console.log('  ' + d);
}
if (missing.length) {
    console.log('\nMISSING:');
    for (const m of missing) console.log('  ' + m);
    process.exit(1);
}
console.log('all static keys resolve ✓');
