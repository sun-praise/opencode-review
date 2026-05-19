## ADDED Requirements

### Requirement: Toggle auto-review via command
系统 SHALL 提供 `/review:auto` 命令，允许用户在运行时切换自动审查开关。

#### Scenario: Toggle without argument
- **WHEN** 用户执行 `/review:auto`
- **THEN** 系统翻转当前 auto-review 状态，并反馈新状态（"自动审查已开启" 或 "自动审查已关闭"）

#### Scenario: Enable with argument
- **WHEN** 用户执行 `/review:auto on`
- **THEN** 系统开启 auto-review，并反馈 "自动审查已开启"

#### Scenario: Disable with argument
- **WHEN** 用户执行 `/review:auto off`
- **THEN** 系统关闭 auto-review，并反馈 "自动审查已关闭"

### Requirement: In-memory state only
auto-review 开关状态 SHALL 仅存储在内存中。

#### Scenario: State resets on restart
- **WHEN** OpenCode 重启
- **THEN** auto-review 开关恢复为配置文件中 `trigger.auto_on_idle` 的值

### Requirement: Toggle tool for agent
系统 SHALL 提供 `toggle_auto_review` tool，供 agent 读写内存中的开关状态。

#### Scenario: Query current state
- **WHEN** agent 调用 `toggle_auto_review`（无参数）
- **THEN** 返回当前 auto-review 是否开启

#### Scenario: Set state
- **WHEN** agent 调用 `toggle_auto_review`（参数 `enabled: true`）
- **THEN** 设置 auto-review 为开启状态，并返回新状态

### Requirement: Auto-review respects in-memory state
`session.idle` 事件处理器 SHALL 检查内存中的开关状态，而非仅检查配置文件。

#### Scenario: Auto-review fires when enabled
- **WHEN** `session.idle` 事件触发 且 内存中 auto-review 为开启
- **THEN** 执行自动审查

#### Scenario: Auto-review suppressed when disabled
- **WHEN** `session.idle` 事件触发 且 内存中 auto-review 为关闭
- **THEN** 不执行自动审查
