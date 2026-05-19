## Why

Auto-review (`auto_on_idle`) 只能通过配置文件 `.opencode/review.json` 控制，修改后需要重启 OpenCode 才能生效。用户在开发过程中需要根据场景随时开关自动审查（比如正在调试时关闭，完成后开启），但目前没有运行时切换的手段。

## What Changes

- 新增 `/review:auto` 命令，用于在运行时切换自动审查开关
- 命令接受可选参数 `on`/`off`，无参数时 toggle 当前状态
- 切换状态仅在内存中维护，不修改配置文件，重启后回到配置文件的默认值
- 命令反馈当前状态（已开启/已关闭）

## Capabilities

### New Capabilities

- `auto-toggle-command`: 运行时切换 auto-review 开关的斜杠命令，包含内存状态管理和用户反馈

### Modified Capabilities

## Impact

- `src/index.ts`: 需要添加新的 command 注册和内存状态变量
- 无新依赖
- 不影响现有 `/review` 命令和 auto-review 配置文件行为
