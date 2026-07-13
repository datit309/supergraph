# Suggested commands
- Full shell tests: `for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`
- Focused test: `bash plugins/supergraph/tests/<test-file>.sh`
- Shell syntax: `bash -n install.sh plugins/supergraph/install.sh plugins/supergraph/tests/test-*.sh`
- Graph index: `codebase-memory-mcp cli index_repository --repo-path "$(pwd)" --name supergraph --mode moderate`
- Validate Codex plugin with plugin-creator `scripts/validate_plugin.py` when manifest/plugin structure changes.