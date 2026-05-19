## 1. 内存状态管理

- [x] 1.1 在 `src/index.ts` 插件闭包中添加 `let autoEnabled = config.trigger.auto_on_idle` 变量
- [x] 1.2 修改 `session.idle` 事件处理器，用 `autoEnabled` 替代 `config.trigger.auto_on_idle` 判断

## 2. Toggle Tool

- [x] 2.1 在 `src/tools/` 下新建 `toggle-auto-review.ts`，实现 `toggle_auto_review` tool（读取/设置 `autoEnabled`）
- [x] 2.2 在 `src/tools/index.ts` 中导出新 tool
- [x] 2.3 在 `src/index.ts` 的 `tool` 中注册 `toggle_auto_review`

## 3. Command 注册

- [x] 3.1 在 `src/index.ts` 的 `config()` 中注册 `review:auto` command，绑定 `review` agent 并提供 template 引导 agent 调用 `toggle_auto_review` tool

## 4. 文档

- [x] 4.1 更新 `README.md`，补充 `/review:auto` 命令说明
