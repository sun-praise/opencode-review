import type { Plugin } from "@opencode-ai/plugin"
import { loadConfig } from "./config.ts"
import { buildAgentPrompt, buildFixerPrompt, buildTogglePrompt } from "./agent.ts"
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

      openCodeConfig.command["review:auto"] = {
        agent: "review",
        description: config.language === "zh"
          ? "切换自动审查开关（on/off）"
          : "Toggle auto-review on/off",
        template: buildTogglePrompt(config),
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
