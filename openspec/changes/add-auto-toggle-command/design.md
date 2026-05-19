## Context

opencode-review 插件当前通过 `.opencode/review.json` 的 `trigger.auto_on_idle` 控制自动审查。配置在插件初始化时读取一次，运行时无法修改。

现有代码结构：
- `src/index.ts` — 插件入口，注册 commands、tools、events
- `src/config.ts` — 读取配置文件，返回 `ReviewConfig`
- 自动审查通过 `session.idle` 事件触发，受 `config.trigger.auto_on_idle` 控制

## Goals / Non-Goals

**Goals:**
- 提供运行时切换 auto-review 开关的命令
- 即时生效，无需重启
- 清晰的状态反馈

**Non-Goals:**
- 不持久化到配置文件（重启后恢复默认值）
- 不修改现有的 config 加载逻辑
- 不影响手动 `/review` 命令

## Decisions

**1. 用 OpenCode command 而非 tool 实现切换**

选择 `openCodeConfig.command["review:auto"]` 注册斜杠命令。用户通过 `/review:auto` 或 `/review:auto on`/`/review:auto off` 操作。

理由：toggle 是用户主动操作，command 比 tool 更符合语义。tool 是 agent 调用的，command 是用户直接调用的。

**2. 在插件闭包中维护内存状态**

在 `src/index.ts` 的插件函数体内添加 `let autoEnabled = config.trigger.auto_on_idle`，command 的 template 引导 agent 读取并翻转这个变量。

由于 OpenCode 的 command template 是静态字符串（在 `config()` 中设置），无法直接操作 JS 变量。实际方案：command 触发 agent，agent 调用一个新的 tool `toggle_auto_review` 来读写内存状态。

**3. 新增 `toggle_auto_review` tool**

提供一个 tool 让 agent 可以读写当前的 auto-review 开关状态：
- 无参数时返回当前状态
- 参数 `enabled: boolean` 时设置状态并返回新状态

## Risks / Trade-offs

- [状态不持久] → 符合设计意图（方案 A），重启回到配置默认值
- [多 session 场景] → OpenCode 插件是单实例，内存状态全局共享，所有 session 看到同一个状态
