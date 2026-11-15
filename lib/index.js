export * from './core.mjs';

// ── DSH 插件接入（方案 A 薄壳：注册 skill 与 CLI 入口；业务逻辑仍在 lib/bin，不在此处）──
import { createPlugin, pkgRootFrom } from '@deepwhale-cn/dsh-guard-core/plugin';

export const { name, inject, apply } = createPlugin({
  name: 'legal-deadline',
  pkgRoot: pkgRootFrom(import.meta.url),
  skillFile: 'skill/legal-deadline.md',
  binFile: 'bin/cli.mjs',
  description: "诉讼时效、上诉期、劳动仲裁时效、行政复议/诉讼期限的起算与届满计算，每项给公式与法条出处",
  whenToUse: "计算诉讼时效、上诉期、劳动仲裁时效、行政复议与行政诉讼期限的届满日。用户会说：还来不来得及上诉、时效过了没。",
});
