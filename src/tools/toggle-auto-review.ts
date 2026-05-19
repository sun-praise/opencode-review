import { tool } from "@opencode-ai/plugin"

export function createToggleAutoReviewTool(getState: () => boolean, setState: (v: boolean) => void) {
  return tool({
    description:
      "Toggle or query the auto-review on/off state. Call without args to check current state, or with 'enabled' to set it.",
    args: {
      enabled: tool.schema.boolean().optional().describe(
        "Set auto-review state. Omit to query current state.",
      ),
    },
    async execute(args) {
      if (args.enabled === undefined) {
        return `Auto-review is currently ${getState() ? "ON" : "OFF"}.`
      }
      setState(args.enabled)
      return `Auto-review is now ${args.enabled ? "ON" : "OFF"}.`
    },
  })
}
