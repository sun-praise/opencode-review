## Context

opencode-review 当前使用单个 `review` agent 串行审查所有维度。每个维度（code-quality、security、performance、testing、documentation）的 prompt 混合在同一个 prompt 中，由一个 agent 完成全部审查。

OpenCode SDK 原生支持 sub-agent 调度（通过 `task` 工具），可以在一个 agent 中并行 spawn 多个 sub-agent 并收集结果。当前项目已有一个 sub-agent 模式：`review:fixer`。

代码结构：
- `src/agent.ts` — 两个函数 `buildAgentPrompt` 和 `buildFixerPrompt`
- `src/config.ts` — `ReviewConfig` 接口
- `src/index.ts` — 插件入口，注册 agent、tool、event handler
- `src/tools/review-changes.ts` — git diff 采集工具

## Goals / Non-Goals

**Goals:**
- 将 5 个审查维度拆分为独立 sub-agent 并行执行
- 保持输出格式与当前版本一致（critical / suggestion / highlight）
- 自动去重和合并不同维度 agent 的重叠发现
- 支持 `parallel` 配置开关，允许回退到单 agent 模式
- 保持 auto-fix 链功能（critical issue → fixer）

**Non-Goals:**
- 不做 agent 间辩论/争论机制（如 spencermarx 的 discourse phase）——复杂度高，收益不确定
- 不做共识评分（如 calimero 的 severity × agreement）——单 agent per 维度无需共识
- 不做收敛检测/增量审查——属于独立功能，不在本次范围
- 不做 Web dashboard
- 不做 GitHub PR 发帖集成

## Decisions

### Decision 1: 维度 sub-agent 拆分策略

**选择**: 每个审查维度一个独立 sub-agent（`review:dim-code-quality`、`review:dim-security` 等 5 个）

**替代方案**:
- A) 按文件类型拆分（前端/后端/配置）——不利于维度专业化
- B) 按严重性拆分（critical scanner / suggestion scanner）——不同维度的 critical 标准不同
- C) 动态拆分（根据 diff 内容决定 spawn 哪些 agent）——增加复杂度，且用户已通过 `dimensions` 配置表达了偏好

**理由**: 维度拆分与现有配置模型（`dimensions` 数组）天然对齐，用户可以选择启用哪些维度，每个维度 agent 只关注一个领域，prompt 更精准。

### Decision 2: 调度模式

**选择**: 主 review agent 作为调度器，通过 `task` 工具并行 spawn 维度 sub-agent，收集结果后生成统一报告

**理由**: OpenCode 的 `task` 工具支持并行 sub-agent 调度。主 agent 负责调度和聚合，不参与实际审查。这与现有的 `review:fixer` 模式一致。

### Decision 3: 结果聚合策略

**选择**: 主 agent 按顺序收集各维度 sub-agent 的输出，按 severity 分组（critical → suggestion → highlight），去重后输出

**理由**: 简单有效。不同维度 agent 可能对同一代码行有不同视角（如 security 和 performance 都关注某个查询），主 agent 负责合并这些重叠发现。

### Decision 4: prompt 文件组织

**选择**: 新增 `src/dimensions/` 目录，每个维度一个文件（`code-quality.ts`、`security.ts` 等），导出 prompt 构建函数

**理由**: 当前 `agent.ts` 已有 200+ 行，拆分后每个维度文件 30-50 行，可维护性更好。也方便未来独立迭代某个维度的 prompt。

### Decision 5: 向后兼容

**选择**: `config.parallel` 默认 `true`。设为 `false` 时使用当前的单 agent 逻辑

**理由**: 多 agent 应该是更好的默认体验，但需要一个回退选项以应对 sub-agent 调度的问题。

## Risks / Trade-offs

- **[Token 消耗增加]** → 5 个 agent 各自独立运行，token 消耗约为当前的 3-5 倍。缓解：每个维度 agent 的 prompt 更短更精准（不需要包含其他维度的指令），部分抵消增长。用户可通过 `parallel: false` 回退。
- **[延迟增加]** → sub-agent 调度有额外开销。缓解：并行执行，总时间应接近单 agent 中最慢的维度。
- **[结果质量不一致]** → 不同维度 agent 可能对同一段代码给出矛盾建议。缓解：主 agent 在聚合时负责识别和解决矛盾。
- **[sub-agent 数量限制]** → OpenCode 可能对同时运行的 sub-agent 数量有限制。缓解：如果有限制，改为串行 spawn + 流式收集。
