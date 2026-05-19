## 1. Config 扩展

- [x] 1.1 在 `ReviewConfig` 接口中添加 `parallel?: boolean` 字段，默认 `true`
- [x] 1.2 在 `DEFAULT_CONFIG` 中添加 `parallel: true`
- [x] 1.3 验证 `loadConfig` 正确合并 `parallel` 字段（全局 + 项目配置）

## 2. 维度 Prompt 文件

- [x] 2.1 创建 `src/dimensions/` 目录
- [x] 2.2 创建 `src/dimensions/code-quality.ts` — 代码质量维度 prompt 构建函数
- [x] 2.3 创建 `src/dimensions/security.ts` — 安全性维度 prompt 构建函数
- [x] 2.4 创建 `src/dimensions/performance.ts` — 性能维度 prompt 构建函数
- [x] 2.5 创建 `src/dimensions/testing.ts` — 测试维度 prompt 构建函数
- [x] 2.6 创建 `src/dimensions/documentation.ts` — 文档维度 prompt 构建函数
- [x] 2.7 创建 `src/dimensions/index.ts` — 导出统一的 `getDimensionPrompts(config)` 函数，返回 `{ name, agentName, prompt }[]`
- [x] 2.8 验证每个维度 prompt 包含：使用 review_changes 工具的指令、维度专注的审查要点、标准输出格式（critical / suggestion / highlight）、中英双语支持

## 3. 主 Agent Prompt 重构

- [x] 3.1 修改 `buildAgentPrompt` 添加并行模式分支：当 `parallel: true` 时生成调度器 prompt（spawn sub-agents + 聚合结果），当 `parallel: false` 时保持当前逻辑
- [x] 3.2 调度器 prompt 需包含：对每个启用维度调用 `task` 工具 spawn `review:dim-<dimension>` sub-agent、收集所有结果、按 severity 分组合并、去重同位置发现、输出统一报告格式
- [x] 3.3 调度器 prompt 需包含 auto-fix 指令：收集所有 critical issues 后 spawn 单个 `review:fixer`

## 4. 插件入口更新

- [x] 4.1 在 `src/index.ts` 中注册 5 个维度 sub-agent（`review:dim-code-quality` 等），每个设置 `mode: "subagent"`、只读权限、对应维度 prompt
- [x] 4.2 维度 sub-agent 的注册需根据 config.dimensions 动态生成（只注册启用的维度）
- [x] 4.3 验证 `review` agent 和 `review:fixer` 的注册不受影响

## 5. 集成验证

- [ ] 5.1 验证并行模式：配置 `parallel: true`，运行 `/review`，确认 5 个维度 sub-agent 并行执行，结果正确聚合（需在 OpenCode 中手动验证）
- [ ] 5.2 验证回退模式：配置 `parallel: false`，运行 `/review`，确认行为与当前版本一致（需在 OpenCode 中手动验证）
- [ ] 5.3 验证 auto-fix 链：并行模式下触发 critical issue，确认 fixer 正确接收合并后的修复指令（需在 OpenCode 中手动验证）
- [ ] 5.4 验证部分维度：配置只启用 `["security", "performance"]`，确认只 spawn 2 个 sub-agent（需在 OpenCode 中手动验证）
- [ ] 5.5 验证中英双语：切换 `language: "en"` 后确认所有维度 prompt 输出英文（需在 OpenCode 中手动验证）
- [ ] 5.6 验证 idle 自动审查：并行模式下 session idle 自动触发审查（需在 OpenCode 中手动验证）
