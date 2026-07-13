# Conventions
- Shell scripts use `#!/usr/bin/env bash` and `set -euo pipefail`.
- Tests are self-contained Bash scripts with temporary fixtures, explicit `fail`, and observable command assertions.
- Preserve existing user changes in dirty worktrees.
- Installer updates must never overwrite non-symlinks or discard dirty Git changes.
- Marketplace config is command-managed; do not hand-edit during reinstall flow.
- Conventional commits use `feat:`, `fix:`, `test:`, `docs:` prefixes.