## ADDED Requirements

### Requirement: Parallel dimension agents
The system SHALL spawn one sub-agent per enabled review dimension. Each sub-agent SHALL be named `review:dim-<dimension>` (e.g., `review:dim-security`). Sub-agents SHALL be spawned in parallel using the `task` tool.

#### Scenario: All 5 dimensions enabled
- **WHEN** config.dimensions contains all 5 dimensions and config.parallel is true
- **THEN** the system spawns 5 sub-agents (`review:dim-code-quality`, `review:dim-security`, `review:dim-performance`, `review:dim-testing`, `review:dim-documentation`) in parallel

#### Scenario: Subset of dimensions enabled
- **WHEN** config.dimensions contains only ["security", "performance"] and config.parallel is true
- **THEN** the system spawns only 2 sub-agents (`review:dim-security`, `review:dim-performance`)

#### Scenario: Parallel mode disabled
- **WHEN** config.parallel is false
- **THEN** the system uses the current single-agent behavior, reviewing all enabled dimensions in one agent

### Requirement: Dimension agent prompts
Each dimension sub-agent SHALL receive a focused prompt that covers only its assigned dimension. The prompt SHALL instruct the agent to use the `review_changes` tool, analyze the diff from its specific perspective, and output findings in the standard format (critical / suggestion / highlight).

#### Scenario: Security dimension agent prompt
- **WHEN** the `review:dim-security` sub-agent is spawned
- **THEN** its prompt focuses exclusively on security concerns (input validation, injection prevention, auth, sensitive data) and outputs findings with file_path:line_number references

#### Scenario: Performance dimension agent prompt
- **WHEN** the `review:dim-performance` sub-agent is spawned
- **THEN** its prompt focuses exclusively on performance concerns (algorithm complexity, query optimization, memory usage, N+1 queries)

### Requirement: Result aggregation
The main review agent SHALL collect all dimension sub-agent results, merge them into a single report grouped by severity (critical → suggestion → highlight), and deduplicate overlapping findings about the same code location.

#### Scenario: Overlapping findings from different dimensions
- **WHEN** `review:dim-security` reports a critical SQL injection at `db.ts:42` and `review:dim-performance` reports a suggestion about the same query at `db.ts:42`
- **THEN** both findings appear in the merged report under their respective severity sections, with the code location referenced once

#### Scenario: No findings from any dimension
- **WHEN** all dimension sub-agents report no issues
- **THEN** the main agent outputs a clean report with highlights only

### Requirement: Auto-fix chain preservation
The auto-fix chain (critical issue → `review:fixer` sub-agent) SHALL continue to work in parallel mode. The main agent SHALL collect all critical issues from all dimension sub-agents and spawn a single fixer with the combined fix instructions.

#### Scenario: Critical issues from multiple dimensions
- **WHEN** `review:dim-security` finds a SQL injection and `review:dim-code-quality` finds a resource leak, both critical
- **THEN** the main agent spawns one `review:fixer` with fix instructions for both issues

#### Scenario: No critical issues in parallel mode
- **WHEN** all dimension sub-agents report zero critical issues
- **THEN** no fixer sub-agent is spawned

### Requirement: Parallel config option
The `ReviewConfig` interface SHALL include an optional `parallel` boolean field (default: `true`). When `false`, the plugin reverts to single-agent mode.

#### Scenario: Config with parallel true
- **WHEN** `.opencode/review.json` contains `"parallel": true` or omits the field
- **THEN** multi-agent parallel review is used

#### Scenario: Config with parallel false
- **WHEN** `.opencode/review.json` contains `"parallel": false`
- **THEN** single-agent review is used (current behavior)

#### Scenario: Config without parallel field
- **WHEN** `.opencode/review.json` does not contain a `parallel` field
- **THEN** multi-agent parallel review is used (default is true)

### Requirement: Dimension prompt files
Each dimension SHALL have its own prompt module file under `src/dimensions/`, exporting a function that returns the dimension-specific prompt string. Files SHALL follow the naming convention `<dimension>.ts` (e.g., `security.ts`, `code-quality.ts`).

#### Scenario: Prompt function returns correct content
- **WHEN** `buildDimensionPrompt("security", config)` is called
- **THEN** it returns a prompt string focused on security review, using the configured language (zh/en)

### Requirement: Output format consistency
The final merged report output format SHALL be identical to the current single-agent format (Overall Assessment → Critical Issues → Suggestions → Highlights), regardless of parallel mode.

#### Scenario: Output format in parallel mode
- **WHEN** parallel review completes with findings
- **THEN** the output uses the same section headers and emoji markers (🔴 🟡 ✅) as single-agent mode

#### Scenario: Language consistency in parallel mode
- **WHEN** config.language is "zh"
- **THEN** the aggregated report and all dimension sub-agent outputs are in Chinese
