import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { homedir } from "node:os"

export interface ReviewConfig {
  language: string
  dimensions: string[]
  max_diff_lines: number
  trigger: {
    auto_on_idle: boolean
  }
  custom_rules: string[]
}

const DEFAULT_CONFIG: ReviewConfig = {
  language: "zh",
  dimensions: [
    "code-quality",
    "security",
    "performance",
    "testing",
    "documentation",
  ],
  max_diff_lines: 500,
  trigger: {
    auto_on_idle: false,
  },
  custom_rules: [],
}

const CONFIG_FILENAME = "review.json"

async function readJsonFile(path: string): Promise<Partial<ReviewConfig> | null> {
  try {
    const content = await readFile(path, "utf-8")
    return JSON.parse(content)
  } catch {
    return null
  }
}

export async function loadConfig(
  projectDir: string,
): Promise<ReviewConfig> {
  const globalPath = join(homedir(), ".config", "opencode", CONFIG_FILENAME)
  const projectPath = join(projectDir, ".opencode", CONFIG_FILENAME)

  const [globalCfg, projectCfg] = await Promise.all([
    readJsonFile(globalPath),
    readJsonFile(projectPath),
  ])

  return {
    ...DEFAULT_CONFIG,
    ...globalCfg,
    ...projectCfg,
    trigger: {
      ...DEFAULT_CONFIG.trigger,
      ...(globalCfg?.trigger ?? {}),
      ...(projectCfg?.trigger ?? {}),
    },
  }
}
// test comment for review
