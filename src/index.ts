import type { Plugin } from "@opencode-ai/plugin"
import { loadConfig } from "./config.ts"
import { buildAgentPrompt, buildFixerPrompt } from "./agent.ts"
import { reviewChanges, createToggleAutoReviewTool } from "./tools/index.ts"

const opencodeReview: Plugin = async ({ project, client, $, directory, worktree }) => {
  const config = await loadConfig(directory)
  const agentPrompt = buildAgentPrompt(config)
  const fixerPrompt = buildFixerPrompt(config)

  let autoEnabled = config.trigger.auto_on_idle
  let lastAutoReviewTime = 0

  return {
    config(openCodeConfig) {
      openCodeConfig.agent ??= {}

      openCodeConfig.agent["review"] = {
        mode: "primary",
        temperature: 0.1,
        steps: 30,
        color: "accent",
        tools: {
          write: false,
          edit: false,
          bash: false,
          task: true,
        },
        permission: {
          bash: {
            "git diff*": "allow",
            "git log*": "allow",
            "git show*": "allow",
          },
        },
      }

      openCodeConfig.agent["review:fixer"] = {
        mode: "subagent",
        temperature: 0.2,
        steps: 20,
        tools: {
          write: true,
          edit: true,
          bash: true,
          read: true,
          grep: true,
          glob: true,
        },
        prompt: fixerPrompt,
      }

      openCodeConfig.command ??= {}
      openCodeConfig.command["review"] = {
        agent: "review",
        description: "Review code changes with structured feedback",
        template: agentPrompt,
      }

      const togglePrompt = config.language === "zh"
        ? `用户请求切换自动审查功能。请立即调用 \`toggle_auto_review\` 工具完成操作，不要做其他事情。

用户参数：{{args}}

规则：
- 如果用户参数包含 "on"，调用 toggle_auto_review(enabled: true)
- 如果用户参数包含 "off"，调用 toggle_auto_review(enabled: false)
- 如果没有参数，调用 toggle_auto_review() 查询当前状态
- 调用后直接将工具返回的结果告诉用户`
        : `The user wants to toggle auto-review. Call the \`toggle_auto_review\` tool immediately and do nothing else.

User args: {{args}}

Rules:
- If args contain "on", call toggle_auto_review(enabled: true)
- If args contain "off", call toggle_auto_review(enabled: false)
- If no args, call toggle_auto_review() to query current state
- Report the tool result directly to the user`

      openCodeConfig.command["review:auto"] = {
        agent: "review",
        description: config.language === "zh"
          ? "切换自动审查开关（on/off）"
          : "Toggle auto-review on/off",
        template: togglePrompt,
      }
    },

    tool: {
      review_changes: reviewChanges,
      toggle_auto_review: createToggleAutoReviewTool(
        () => autoEnabled,
        (v) => { autoEnabled = v },
      ),
    },

    event: async ({ event }) => {
      if (event.type === "session.idle" && autoEnabled) {
        const now = Date.now()
        if (now - lastAutoReviewTime < config.trigger.cooldown_seconds * 1000) return
        lastAutoReviewTime = now

        const ev = event as any
        const sessionID = ev.properties?.sessionID ?? ev.properties?.id ?? ev.id
        if (!sessionID) return

        try {
          await client.session.promptAsync({
            body: {
              agent: "review",
              parts: [
                {
                  type: "text",
                  text: "Session completed. Running automatic code review on staged changes...",
                },
              ],
            },
            path: { id: sessionID },
          })
        } catch {}
      }
    },
  }
}

export default opencodeReview
