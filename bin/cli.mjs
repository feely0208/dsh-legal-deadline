#!/usr/bin/env node
/**
 * dsh-legal-deadline —— 诉讼期限计算器（离线 CLI，契约同 dsh-legal-damages）
 * 用法：dsh-legal-deadline --type <...> [参数] [--out 目录] [--json] ；--demo 跑内置样例
 * 退出码：0 成功 / 2 参数错误
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { calc, buildCsv, buildMarkdown, DEMO, TYPES, CATEGORY } from '../lib/core.mjs';

const args = process.argv.slice(2);
const has = (k) => args.includes('--' + k);
const val = (k, d = '') => {
  const i = args.indexOf('--' + k);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d;
};

if (has('help') || (!args.length && process.stdin.isTTY)) {
  console.log('dsh-legal-deadline —— 诉讼期限计算器\n\n用法：--type <' + TYPES.join('|') + '> [参数] [--out 目录] [--json]；--demo');
  process.exit(0);
}

if (has('demo')) {
  const results = [];
  for (const t of TYPES) {
    const r = calc(t, DEMO[t]);
    if (!r.ok) { console.error('❌ ' + r.error); process.exit(2); }
    results.push(r);
  }
  for (const r of results) {
    console.log(`${r.title}`);
    for (const i of r.items) console.log(`  ${i.name}  ${i.sub || ''}  = ${i.amount ?? ''}`);
    for (const n of r.notes) console.log('· ' + n);
    console.log('');
  }
  process.exit(0);
}

const type = String(val('type', '')).trim().toLowerCase();
const input = {};
for (const a of args) {
  const m = a.match(/^--([a-z0-9-]+)$/i);
  if (m && !['type', 'json', 'out', 'demo'].includes(m[1])) input[m[1].replace(/-(\w)/g, (_, c) => c.toUpperCase())] = val(m[1]);
}
const r = calc(type, input);
if (!r.ok) {
  if (has('json')) console.log(JSON.stringify(r, null, 2));
  else console.error('❌ ' + r.error);
  process.exit(2);
}
if (has('json')) console.log(JSON.stringify(r, null, 2));
else {
  console.log(`${r.title}`);
  for (const i of r.items) console.log(`  ${i.name}  ${i.formula || ''}（${i.sub || ''}） = ${i.amount ?? ''}`);
  for (const n of r.notes) console.log('· ' + n);
}
process.exit(0);
