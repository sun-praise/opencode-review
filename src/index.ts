import type { Plugin } from "@opencode-ai/plugin"
import { loadConfig } from "./config.ts"
import { buildAgentPrompt, buildFixerPrompt } from "./agent.ts"
import { reviewChanges } from "./tools/index.ts"

const opencodeReview: Plugin = async ({ project, client, $, directory, worktree }) => {
  const config = await loadConfig(directory)
  const agentPrompt = buildAgentPrompt(config)
  const fixerPrompt = buildFixerPrompt(config)

  // Loop prevention: tracks whether an auto-review is in progress
  let autoReviewActive = false

  return {
    config(openCodeConfig) {
      openCodeConfig.agent ??= {}

      // Main review agent — can spawn fixer sub-agent via task tool
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

      // Fixer sub-agent — has write capabilities to apply fixes
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
        prompt: agentPrompt,
      }
    },

    tool: {
      review_changes: reviewChanges,
    },

    event: async ({ event }) => {
      if (event.type === "session.idle" && config.trigger.auto_on_idle) {
        // Prevent infinite loop: if an auto-review is already in progress,
        // reset the flag and skip
        if (autoReviewActive) {
          autoReviewActive = false
          return
        }
        autoReviewActive = true
        await client.chat.send({
          message:
            "Session completed. Running automatic code review on staged changes...",
          agent: "review",
        })
      }
    },
  }
}

export default opencodeReview
