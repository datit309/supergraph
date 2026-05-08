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

### Option 1: Local Plugin Directory

```bash
# Tạo plugins directory nếu chưa có
mkdir -p ~/.agents/plugins

# Copy plugin vào marketplace
cp -r /path/to/supergraph/plugins/supergraph-codex ~/.agents/plugins/

# Thêm vào marketplace.json
cat >> ~/.agents/plugins/marketplace.json << 'EOF'
{
  "plugins": [
    {
      "name": "supergraph",
      "source": "./supergraph-codex",
      "version": "1.0.0",
      "description": "Mandatory AI workflows + intelligent codebase graph analysis"
    }
  ]
}
EOF
```

### Option 2: Git Repository

```bash
# Clone repo
git clone https://github.com/datit309/supergraph.git

# Copy plugin vào marketplace
cp -r supergraph/plugins/supergraph-codex ~/.agents/plugins/

# Cập nhật marketplace.json
cat >> ~/.agents/plugins/marketplace.json << 'EOF'
{"plugins":[{"name":"supergraph","source":"./supergraph-codex","version":"1.0.0"}]}
EOF
```

### Option 3: Codex CLI Marketplace Commands

```bash
# From GitHub (owner/repo format)
codex plugin marketplace add datit309/supergraph

# From specific branch
codex plugin marketplace add datit309/supergraph --ref main

# From any Git URL (sparse checkout)
codex plugin marketplace add https://github.com/datit309/supergraph.git --sparse .agents/plugins

# From local directory
codex plugin marketplace add ./supergraph-codex
```

### Option 4: Repo-scoped Marketplace (cho team)

```bash
# Thêm vào .agents/plugins/marketplace.json ở repo root
# Tạo file nếu chưa có
mkdir -p .agents/plugins

cat > .agents/plugins/marketplace.json << 'EOF'
{
  "plugins": [
    {
      "name": "supergraph",
      "source": "https://github.com/datit309/supergraph.git",
      "version": "1.0.0",
      "description": "Mandatory AI workflows + graph analysis"
    }
  ]
}
EOF
```

### Sau khi Install

1. **Restart Codex** để load plugin
2. **Verify installation:**
   ```bash
   codex --plugins list
   # hoặc
   /plugins
   ```
3. **Trigger skills** với `$` prefix hoặc `@supergraph:skill-name`

## Usage

Gọi skills với `$` prefix trong conversation:

```bash
$sg-context     # Load codebase graph khi bắt đầu session
$sg-brainstorm  # Hiểu task với graph data trước khi code
$sg-plan        # Tạo plan với blast radius analysis
$sg-tdd         # Implement với RED → GREEN → REFACTOR
$sg-fix         # Auto-fix loop (test + lint + review)
$sg-review      # Graph-enhanced code review trước merge
$sg-finish      # Merge, PR, hoặc discard
```

**Alternative invocation:**
```bash
@supergraph:sg-tdd    # Dùng @ để trigger specific skill
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