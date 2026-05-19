## Why

当前 opencode-review 使用单一 agent 审查所有维度（code-quality、security、performance、testing、documentation）。竞品分析（见 #2）表明，多 agent 并行审查是行业趋势——spencermarx/open-code-review（179 Stars）使用多 agent 辩论机制，calimero/ai-code-reviewer 使用 5 个专业 agent 共识评分。单 agent 在复杂 diff 中容易遗漏维度、输出笼统，且无法利用 OpenCode 的 subagent 并行能力。现在 OpenCode SDK 已原生支持 sub-agent 调度（`task` 工具），实现多 agent 并行审查的时机已成熟。

## What Changes

- 新增**维度 agent 调度器**：将 5 个审查维度（code-quality、security、performance、testing、documentation）拆分为独立的 sub-agent，并行执行审查
- 新增**结果聚合器**：收集各维度 agent 的审查结果，去重、合并、按严重性排序，输出统一报告
- 修改 `buildAgentPrompt`：review agent 从"执行所有维度审查"变为"调度维度 sub-agent + 聚合结果"
- 新增 5 个维度 sub-agent prompt（`review:code-quality`、`review:security`、`review:performance`、`review:testing`、`review:documentation`）
- 修改 `ReviewConfig`：新增 `parallel` 开关（默认 true），允许回退到单 agent 模式
- 保持向后兼容：`parallel: false` 时行为与当前版本一致

## Capabilities

### New Capabilities
- `parallel-review`: 多维度 sub-agent 并行审查、结果聚合、统一报告生成

### Modified Capabilities
（无现有 specs）

## Impact

- **代码变更**：`src/agent.ts`（拆分为调度 prompt + 5 个维度 prompt）、`src/config.ts`（新增 `parallel` 字段）、`src/index.ts`（注册 5 个 sub-agent）
- **新增文件**：`src/dimensions/` 目录，每个维度一个 prompt 文件
- **Token 消耗**：并行模式 token 消耗会增加（5 个 agent 各自独立运行），但总审查时间缩短（并行 vs 串行）
- **配置**：`.opencode/review.json` 新增可选字段 `"parallel": true`
- **无 breaking change**：默认行为从单 agent 切换为多 agent，但输出格式不变；用户可通过 `parallel: false` 回退
