import { describe, expect, test } from "bun:test"
import { buildAgentPrompt, buildFixerPrompt, buildTogglePrompt } from "./agent.ts"
import { getLang, type ReviewConfig } from "./config.ts"
import { getDimensionPrompts } from "./dimensions/index.ts"

function makeConfig(language: string, overrides: Partial<ReviewConfig> = {}): ReviewConfig {
  return {
    language,
    dimensions: [],
    max_diff_lines: 500,
    trigger: {
      auto_on_idle: false,
      cooldown_seconds: 120,
    },
    custom_rules: [],
    parallel: true,
    ...overrides,
  }
}

describe("getLang", () => {
  test.each(["zh", "en", "tr"])("returns supported language %s", (language) => {
    expect(getLang(makeConfig(language))).toBe(language)
  })

  test("falls back to English for an unsupported language", () => {
    expect(getLang(makeConfig("de"))).toBe("en")
  })
})

describe("localized review prompts", () => {
  test.each([
    ["zh", "你是一个代码审查调度器"],
    ["en", "You are a code review orchestrator"],
    ["tr", "Sen bir kod inceleme orkestratörüsün"],
  ])("builds %s prompts for every agent", (language, orchestratorIntro) => {
    const config = makeConfig(language, { dimensions: ["code-quality"] })

    expect(buildAgentPrompt(config)).toContain(orchestratorIntro)
    expect(buildFixerPrompt(config)).toContain(
      language === "tr" ? "Sen bir kod düzeltme ajanısın" : language === "zh"
        ? "你是一个代码修复代理"
        : "You are a code fixer agent",
    )
    expect(buildTogglePrompt(config)).toContain(
      language === "tr" ? "Kullanıcı otomatik incelemeyi değiştirmek istiyor" : language === "zh"
        ? "用户请求切换自动审查功能"
        : "The user wants to toggle auto-review",
    )
    expect(getDimensionPrompts(config)[0]?.prompt).toContain(
      language === "tr" ? "**Kod kalitesi**" : language === "zh"
        ? "**代码质量**"
        : "**code quality**",
    )
  })

  test("uses English prompts for an unsupported language", () => {
    const config = makeConfig("de", { dimensions: ["code-quality"] })

    expect(buildAgentPrompt(config)).toContain("You are a code review orchestrator")
    expect(buildFixerPrompt(config)).toContain("You are a code fixer agent")
    expect(buildTogglePrompt(config)).toContain("The user wants to toggle auto-review")
    expect(getDimensionPrompts(config)[0]?.prompt).toContain("**code quality**")
  })

  test("preserves custom rules in Turkish single-agent mode", () => {
    const config = makeConfig("tr", {
      custom_rules: ["İş mantığını değiştirme"],
      parallel: false,
    })

    expect(buildAgentPrompt(config)).toContain("### Custom Rules\n- İş mantığını değiştirme")
  })
})
