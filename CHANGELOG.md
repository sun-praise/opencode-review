# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Turkish language support for review prompts, dimension agents, and commands

## [0.2.0] - 2025-05-19

### Added

- Multi-agent parallel review: split review into 5 independent dimension sub-agents (code-quality, security, performance, testing, documentation) that run concurrently
- `parallel` config option to toggle between parallel and single-agent mode (default: true)
- Dimension sub-agents registered dynamically based on config.dimensions
- Auto-review toggle command (`/review:auto on/off`) with session-level state
- Chinese and English bilingual prompts for all dimensions
- Openspec artifacts for multi-agent parallel review change

### Fixed

- Bun shell compatibility: wrap git commands in `bash -c` to avoid template literal variable interpolation errors
- Dedup dimension config entries with Set

## [0.1.0] - 2025-05-16

### Added

- Initial release of opencode-review plugin
- `review_changes` tool to gather git diff for staged, last-commit, or branch scope
- Configurable review dimensions, custom rules, and language (zh/en)
- Auto-review on session idle with configurable cooldown
- `review:fixer` sub-agent for auto-fixing critical issues
- OpenCode plugin integration with agent, command, and event hooks
