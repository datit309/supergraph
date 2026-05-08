# supergraph for OpenAI Codex

Claude Code plugin chuyển sang format cho OpenAI Codex.

## Khác biệt với Claude Code Version

| Component | Claude Code | OpenAI Codex |
|------------|-------------|--------------|
| Manifest | `.claude-plugin/plugin.json` | `.codex-plugin/plugin.json` |
| Invocation | `/sg-tdd` | `$sg-tdd` (dùng $ prefix) |
| Trigger | autoTrigger tự động | Trigger qua @ hoặc mô tả |
| Marketplace | `/plugin marketplace add` | `.agents/plugins/marketplace.json` |

## Install

### Option 1: Local Marketplace

```bash
# Tạo marketplace local
mkdir -p ~/.agents/plugins
cp -r plugins/supergraph-codex ~/.agents/plugins/
echo '{"plugins":[{"name":"supergraph","source":"./supergraph-codex","version":"1.0.0"}]}' >> ~/.agents/plugins/marketplace.json
```

### Option 2: Git Repository

```bash
# Clone repo
git clone https://github.com/datit309/supergraph.git

# Copy vào marketplace
cp -r supergraph/plugins/supergraph-codex ~/.agents/plugins/
```

## Usage

Sau khi install, gọi skills với `$` prefix:

```bash
$sg-context     # Load codebase graph
$sg-brainstorm  # Hiểu task với graph data
$sg-plan        # Tạo plan với blast radius
$sg-tdd         # Implement với TDD
$sg-fix         # Auto-fix loop
$sg-review      # Graph-enhanced review
$sg-finish      # Merge/PR/discard
```

## Skills

| Skill | Trigger | Mô tả |
|-------|---------|-------|
| `$sg-context` | Session start | Load codebase graph |
| `$sg-brainstorm` | Non-trivial task | Hiểu requirement với graph |
| `$sg-plan` | Before coding | Graph-informed task breakdown |
| `$sg-tdd` | Every implementation | RED → GREEN → REFACTOR |
| `$sg-review` | Before merge | Graph-enhanced code review |
| `$sg-blast` | Impact analysis | Find affected files |
| `$sg-fix` | After coding | Auto test + lint + review loop |
| `$sg-refactor` | Refactoring | Safe incremental refactoring |
| `$sg-inspect` | Deep dive | File/symbol/module analysis |
| `$sg-execute` | Executing plan | Run saved plan with checkpoints |
| `$sg-finish` | Completing work | Merge, PR, or discard options |

## Prerequisites

- OpenAI Codex CLI
- Python 3.8+ (cho code-review-graph)
- Git repository

## License

MIT