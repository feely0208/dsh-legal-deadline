# @deepwhale-cn/dsh-legal-deadline

> **技能型插件 · 无面板**：安装后由 DSH 智能体按 skill 说明调用 CLI；无独立面板界面。

安装到 DSH：

```bash
dsh plugin --profile web add @deepwhale-cn/dsh-legal-deadline
```

诉讼期限计算器：诉讼时效（含中断/最长保护期）、上诉期、劳动仲裁时效、行政复议/诉讼期限的起算与届满计算。每项给公式、代入值与法条出处，可手算复核。

## 用法

```bash
npx @deepwhale-cn/dsh-legal-deadline --type appeal --kind judgment --served 2024-05-20
npx @deepwhale-cn/dsh-legal-deadline --type limitation --aware 2023-01-10 --interrupts 2024-03-01
npx @deepwhale-cn/dsh-legal-deadline --demo
npx @deepwhale-cn/dsh-legal-deadline --type appeal --served 2024-05-20 --out ./产物目录
```

## 边界

- 算的是**法定一般期间**：节假日顺延只自动处理周六/周日；中止/中断的认定是事实问题
- 不构成法律意见；产物为 计算表.csv + 计算说明.md（--out 时）
