# opencode-review

An automatic code review plugin for [OpenCode](https://opencode.ai) CLI. Automatically reviews staged changes when a session goes idle, with configurable cooldown, multi-dimension analysis, and auto-fix support.

## Features

- **Auto-review on idle** — automatically triggers code review when session completes, with configurable cooldown (`cooldown_seconds`) to prevent duplicate reviews
- **Auto-fix chain** — critical issues spawn a `review:fixer` sub-agent that applies minimal fixes automatically
- **On-demand review** — `/review` slash command or Tab-switchable `review` agent for manual reviews
- Three review scopes: staged changes, last commit, full branch diff
- Configurable review dimensions (code quality, security, performance, testing, documentation)
- Structured output with severity levels (critical / suggestion / highlight)
- Supports Chinese and English output

## Installation

### Local plugin (recommended)

Copy or symlink into your OpenCode plugins directory:

```bash
# Project-level
mkdir -p .opencode/plugins
ln -s /path/to/opencode-review/src/index.ts .opencode/plugins/opencode-review.ts

# Or global
ln -s /path/to/opencode-review/src/index.ts ~/.config/opencode/plugins/opencode-review.ts
```

### npm (coming soon)

Add to your `opencode.json`:

```json
{
  "plugin": ["opencode-review"]
}
```

## Usage

### Slash Command

```
/review                    # Review staged changes
/review:auto               # Toggle auto-review (query current state)
/review:auto on            # Enable auto-review
/review:auto off           # Disable auto-review
```

Note: `/review:auto` changes are in-memory only and reset to the config file value on restart.

### Agent Mode

Press `Tab` twice to switch to the `review` agent, then describe what you want reviewed.

### CLI

```bash
opencode run --agent review "Review the current changes"
```

## Configuration

Create `.opencode/review.json` in your project (or `~/.config/opencode/review.json` globally):

```json
{
  "language": "zh",
  "dimensions": [
    "code-quality",
    "security",
    "performance",
    "testing",
    "documentation"
  ],
  "max_diff_lines": 500,
  "trigger": {
    "auto_on_idle": true,
    "cooldown_seconds": 120
  },
  "custom_rules": [
    "All API endpoints must have error handling",
    "Database queries must use parameterized statements"
  ]
}
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `language` | Output language (`"zh"` or `"en"`) | `"zh"` |
| `dimensions` | Review dimensions to check | All 5 dimensions |
| `max_diff_lines` | Max diff lines before truncation | `500` |
| `trigger.auto_on_idle` | Auto-review when session goes idle | `false` |
| `trigger.cooldown_seconds` | Minimum interval between auto-reviews (seconds) | `120` |
| `custom_rules` | Additional project-specific rules | `[]` |

## License

MIT
