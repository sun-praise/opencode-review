import type { Plugin } from "@opencode-ai/plugin"
import { loadConfig } from "./config.ts"
import { buildAgentPrompt, buildFixerPrompt } from "./agent.ts"
import { reviewChanges } from "./tools/index.ts"

const opencodeReview: Plugin = async ({ project, client, $, directory, worktree }) => {
  const config = await loadConfig(directory)
  const agentPrompt = buildAgentPrompt(config)
  const fixerPrompt = buildFixerPrompt(config)

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
    },

    tool: {
      review_changes: reviewChanges,
    },

    event: async ({ event }) => {
      if (event.type === "session.idle" && config.trigger.auto_on_idle) {
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
