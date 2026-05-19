import { tool } from "@opencode-ai/plugin"

export const reviewChanges = tool({
  description:
    "Gather git diff for code review. Returns file list, change stats, and diff content.",
  args: {
    scope: tool.schema.enum(["staged", "last-commit", "branch"]).describe(
      "Review scope: 'staged' for git staged changes, 'last-commit' for the most recent commit, 'branch' for all changes on the current branch vs default branch",
    ),
    max_lines: tool.schema.number().optional().describe(
      "Maximum diff lines to return (default from config)",
    ),
  },
  async execute(args, context) {
    const { $, directory } = context
    const scope = args.scope ?? "staged"
    const maxLines = args.max_lines ?? 500

    let diffResult: string
    let statsResult: string

    switch (scope) {
      case "staged":
        diffResult = await runCommand($, "git diff --cached")
        statsResult = await runCommand($, "git diff --cached --stat")
        break
      case "last-commit":
        diffResult = await runCommand($, "git show --format='' HEAD")
        statsResult = await runCommand($, "git show --format='' --stat HEAD")
        break
      case "branch": {
        const defaultBranch = await getDefaultBranch($)
        diffResult = await runCommand($, `git diff ${defaultBranch}...HEAD`)
        statsResult = await runCommand($, `git diff ${defaultBranch}...HEAD --stat`)
        break
      }
    }

    let diff = diffResult
    const stats = statsResult

    const truncated = diff.split("\n").length > maxLines
    if (truncated) {
      diff = diff.split("\n").slice(0, maxLines).join("\n")
    }

    if (!diff.trim()) {
      return "No changes found for the selected scope."
    }

    let output = `## Change Stats\n${stats}\n\n## Diff\n\`\`\`diff\n${diff}\n\`\`\``
    if (truncated) {
      output += `\n\n⚠️ Diff truncated at ${maxLines} lines. Use a smaller scope or increase max_lines for full review.`
    }

    return output
  },
})

async function runCommand($: any, cmd: string): Promise<string> {
  try {
    const result = await $`bash -c ${cmd}`.quiet()
    return result.stdout ?? ""
  } catch {
    return ""
  }
}

async function getDefaultBranch($: any): Promise<string> {
  try {
    const result = await $`bash -c 'git remote show origin'`.quiet()
    const match = (result.stdout ?? "").match(/HEAD branch: (.+)/)
    if (match) return match[1]
  } catch {
    // fallback
  }
  return "main"
}
