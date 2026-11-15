/**
 * dsh-legal-deadline —— 诉讼期限计算器 · 纯计算内核
 * 契约同 dsh-legal-damages：calc(type, input) / buildCsv / buildMarkdown / DEMO / TYPES / CATEGORY
 *
 * ⚠️ 免责口径：这里算的是「法定一般期间」，遇法定节假日顺延、法院/机构另行指定的期限，
 *    以通知为准；地方与特别程序有例外。每项结果都带法条出处，供人工复核。
 */
import { parseDate, addDays, fmtDate } from './date.mjs';
export { parseDate, addDays, fmtDate };

export const TYPES = ['limitation', 'appeal', 'labor', 'admin-review', 'admin-suit'];
export const CATEGORY = {
  limitation: '民事诉讼时效', appeal: '上诉期', labor: '劳动仲裁时效',
  'admin-review': '行政复议申请期', 'admin-suit': '行政诉讼起诉期',
};

export const DEMO = {
  limitation: { aware: '2023-01-10', harm: '2022-06-01', interrupts: ['2024-03-01'] },
  appeal: { kind: 'judgment', served: '2024-05-20' },
  labor: { aware: '2024-06-01', employmentEnd: '' },
  'admin-review': { aware: '2024-04-01' },
  'admin-suit': { aware: '2024-04-01', kind: 'normal' },
};

/** 加月/加年（自然月/年，超出月末自动回退到月末） */
export function addMonths(date, n) {
  const d = new Date(date.getTime());
  const day = d.getDate();
  d.setMonth(d.getMonth() + n);
  if (d.getDate() < day) d.setDate(0); // 回退到上月末（如 1/31 + 1 月 → 2/28）
  return d;
}
export function addYears(date, n) { return addMonths(date, n * 12); }

/** 期间届满最后一日为周六/周日的，顺延到下一工作日（法定节假日需人工核对） */
function deferWeekend(d) {
  const x = new Date(d.getTime());
  while (x.getDay() === 0 || x.getDay() === 6) x.setDate(x.getDate() + 1);
  return x;
}

const WEEKNOTE = '期间最后一日遇周六/周日的已自动顺延；法定节假日（春节/国庆等）请对照国务院放假通知人工核对。';

export function calc(type, input = {}) {
  if (!TYPES.includes(type)) {
    return { ok: false, error: `未知类型 ${type}（可选：${TYPES.map((t) => `${t}（${CATEGORY[t]}）`).join('、')}）` };
  }
  const items = [];
  const notes = [];

  if (type === 'limitation') {
    const aware = parseDate(input.aware);
    const harm = parseDate(input.harm || input.aware);
    if (!aware) return { ok: false, error: '需要 --aware（知道或应当知道权利受损之日，YYYY-MM-DD）' };
    const interrupts = (input.interrupts ? String(input.interrupts).split(/[,，]/) : [])
      .map((s) => parseDate(s.trim())).filter(Boolean).sort((a, b) => a - b);
    let start = aware;
    items.push({ name: '普通时效起算', formula: '自知道或应当知道权利受损之日起 3 年（民法典第188条）', sub: `起算 ${fmtDate(start)}`, amount: '' });
    interrupts.forEach((d, i) => {
      const due = deferWeekend(addYears(start, 3));
      items.push({ name: `第 ${i + 1} 次中断后的届满日`, formula: '中断后重新起算 3 年', sub: `中断 ${fmtDate(d)} → 起算点更新为中断日`, amount: fmtDate(due) });
      start = d;
    });
    const due = deferWeekend(addYears(start, 3));
    items.push({ name: '当前起算点届满日', formula: '起算点 + 3 年', sub: `起算 ${fmtDate(start)}`, amount: fmtDate(due) });
    if (harm) {
      const maxDue = addYears(harm, 20);
      items.push({ name: '最长权利保护期届满', formula: '自权利受损之日起 20 年（民法典第188条第2款）', sub: `受损 ${fmtDate(harm)}`, amount: fmtDate(maxDue) });
      notes.push('若 20 年最长保护期早于普通时效届满，超出部分法院不予保护（特殊情况可申请延长）。');
    }
    notes.push('时效中止（最后 6 个月内因不可抗力等障碍）按民法典第194条另行核对，本工具未自动计算。');
    notes.push(WEEKNOTE);
    return { ok: true, type, title: '民事诉讼时效计算（民法典第188条）', items, total: 0, notes };
  }

  if (type === 'appeal') {
    const served = parseDate(input.served);
    if (!served) return { ok: false, error: '需要 --served（判决/裁定送达之日，YYYY-MM-DD）' };
    const days = input.kind === 'ruling' ? 10 : 15;
    items.push({ name: input.kind === 'ruling' ? '裁定上诉期届满' : '判决上诉期届满', formula: `送达之日起 ${days} 日（不含当日，次日起算）`, sub: `送达 ${fmtDate(served)}`, amount: fmtDate(deferWeekend(addDays(served, days))) });
    notes.push('依据：《民事诉讼法》不服判决的上诉期为十五日、不服裁定的上诉期为十日（自送达之日起算）。');
    notes.push('送达日认定（留置/公告送达等）直接影响起算，请核对送达回证。' + WEEKNOTE);
    return { ok: true, type, title: '上诉期计算（民事诉讼法）', items, total: 0, notes };
  }

  if (type === 'labor') {
    const aware = parseDate(input.aware);
    if (!aware) return { ok: false, error: '需要 --aware（知道或应当知道权利被侵害之日，YYYY-MM-DD）' };
    const end = parseDate(input['employment-end'] || input.employmentEnd || '');
    items.push({ name: '仲裁时效届满', formula: '1 年（劳动争议调解仲裁法第27条第1款）', sub: `起算 ${fmtDate(aware)}`, amount: fmtDate(deferWeekend(addYears(aware, 1))) });
    if (end) {
      items.push({ name: '劳动关系终止后时效', formula: '终止之日起 1 年内提出（第27条第4款）', sub: `终止 ${fmtDate(end)}`, amount: fmtDate(deferWeekend(addYears(end, 1))) });
      notes.push('拖欠劳动报酬争议，劳动关系存续期间不受 1 年限制；终止后应自终止之日起 1 年内提出（第27条第4款）。');
    }
    notes.push(WEEKNOTE);
    return { ok: true, type, title: '劳动仲裁时效计算（劳动争议调解仲裁法第27条）', items, total: 0, notes };
  }

  if (type === 'admin-review') {
    const aware = parseDate(input.aware);
    if (!aware) return { ok: false, error: '需要 --aware（知道或应当知道行政行为之日，YYYY-MM-DD）' };
    items.push({ name: '复议申请期届满', formula: '60 日（行政复议法：自知道或应当知道行政行为之日起）', sub: `起算 ${fmtDate(aware)}`, amount: fmtDate(deferWeekend(addDays(aware, 60))) });
    notes.push('依据：《行政复议法》（2023 修订）—— 不动产物权等特殊情形与利害关系起算有例外，以受理机关告知为准。' + WEEKNOTE);
    return { ok: true, type, title: '行政复议申请期计算（行政复议法）', items, total: 0, notes };
  }

  if (type === 'admin-suit') {
    const aware = parseDate(input.aware);
    if (!aware) return { ok: false, error: '需要 --aware（知道或应当知道行政行为之日，YYYY-MM-DD）' };
    const isEstate = String(input.kind || '') === 'estate';
    const years = isEstate ? 20 : 5;
    items.push({ name: '起诉期届满', formula: '6 个月（行政诉讼法第46条第1款）', sub: `起算 ${fmtDate(aware)}`, amount: fmtDate(deferWeekend(addMonths(aware, 6))) });
    items.push({ name: isEstate ? '最长保护期（不动产）' : '最长保护期（其他案件）', formula: `自行政行为作出之日起 ${years} 年（第46条第2款）`, sub: '需提供行为作出日，本项仅为提醒', amount: `${years} 年上限` });
    notes.push('依据：《行政诉讼法》第46条 —— 直接起诉 6 个月；不动产案件最长 20 年、其他案件最长 5 年（自行为作出之日起）。' + WEEKNOTE);
    return { ok: true, type, title: '行政诉讼起诉期计算（行政诉讼法第46条）', items, total: 0, notes };
  }
}

export function buildCsv(r) {
  const rows = [['项目', '公式', '代入', '结果']];
  for (const i of r.items) rows.push([i.name, i.formula || '', i.sub || '', String(i.amount ?? '')]);
  return rows.map((x) => x.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
}

export function buildMarkdown(r, { generatedAt = '' } = {}) {
  const L = [`# ${r.title}`];
  if (generatedAt) L.push('', `生成时间：${generatedAt}`);
  L.push('', '| 项目 | 公式 | 代入 | 结果 |', '|---|---|---|---|');
  for (const i of r.items) L.push(`| ${i.name} | ${i.formula || ''} | ${i.sub || ''} | ${i.amount ?? ''} |`);
  if (r.notes?.length) L.push('', '## 说明', '', ...r.notes.map((n) => `- ${n}`));
  L.push('', '> 本工具输出为法定一般期间的参考计算，不构成法律意见；期间顺延、程序转换、送达认定等以法院/机构通知为准。');
  return L.join('\n') + '\n';
}
