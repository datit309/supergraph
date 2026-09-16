# SDD: Codebase Memory MCP 0.10.8 compatibility

Status: approved by explicit user request to fix the baseline failure.
Date: 2026-09-16

## Problem

The migration test requires the obsolete exact version `codebase-memory-mcp 0.9.0`, while the installed and current upstream CLI is `0.10.8`. The newer CLI also changes `cli` output behavior: `detect_changes` is human-readable by default and `--json` returns an MCP result envelope with the useful payload under `structuredContent`.

## Goals

- Accept supported Codebase Memory releases from `0.10.8` through, but not including, `0.11.0`.
- Make migration recipes consume stable JSON regardless of direct-result versus MCP-envelope output.
- Keep CI reproducible by pinning `0.10.8`.
- Update current user-facing docs and plugin metadata without rewriting historical changelog or migration records.
- Preserve the existing graph-provider contract and plugin command configuration.

## Non-goals

- Changing the plugin MCP server protocol or hook behavior.
- Modifying Codebase Memory's cache location or permissions.
- Supporting unbounded future major/minor CLI formats without a deliberate compatibility update.

## Design

```text
recipes()
  -> require codebase-memory-mcp >= 0.10.8,<0.11.0
  -> cbm(tool, args)
       -> codebase-memory-mcp cli --json tool --args-file args
       -> decode first JSON value
       -> unwrap structuredContent when present
       -> normalize text-only query rows when query_graph has no structured payload
       -> assert the existing direct result contract
```

### Version contract

The test accepts semantic versions greater than or equal to `0.10.8` and less than `0.11.0`. CI installs exactly `0.10.8` so the verification environment is deterministic. Documentation uses the same bounded compatibility range.

### CLI result contract

`cbm()` always requests `--json`. Its normalizer accepts:

1. a direct JSON result (legacy/current compatible form), or
2. an MCP envelope containing a dictionary `structuredContent` payload, or
3. an MCP envelope whose `content[0].text` is the CLI's row-rendered query output.

The normalizer reads the first JSON object from stdout because the supported 0.10.x CLI can emit a duplicate result in some invocation paths. Malformed output remains a hard failure with the captured stderr available to the test.

For text-only `query_graph` output, the shared adapter
`plugins/supergraph/scripts/normalize-codebase-memory-json.py` extracts the
`cols` header and space-delimited row values into the existing `{"rows": [...]}`
test shape. The migration and CI queries return identifier/path/scalar columns
without spaces, so this conversion is deterministic and bounded by the CLI's
row ceiling.

### Error handling

- Missing command or version outside the supported range: fail with an actionable requirement message.
- Human-readable CLI output: `detect_changes` requests `format:"json"`; text-only `query_graph` rows are normalized by the adapter; malformed output still fails closed.
- Cache permission failures: reported as environment/setup errors; this change does not mutate user cache permissions.
- Graph API assertion failure: retain the existing recipe-specific assertion and fail the migration test.

## Platform matrix

| Environment | Version policy | CLI policy | Verification |
| --- | --- | --- | --- |
| macOS/Linux local | `>=0.10.8,<0.11.0` | `cli --json`; `detect_changes` uses `format:"json"`; shared adapter unwraps envelope/rows | migration recipes + full shell suite |
| GitHub Actions | exact `0.10.8` | every graph call uses `cli --json` and shared adapter; `detect_changes` uses `format:"json"`; query rows normalize to `rows` | graph-review workflow |
| Windows Git Bash hooks | provider command unchanged | no hook graph invocation | existing hook tests |

## Compatibility and rollback

The change is limited to the migration test, CI install pin, current docs/metadata, and generated scan test-command guidance. Rollback is a revert of this change set. Historical changelog entries remain untouched so release history is not rewritten.

## ADR

Decision: move the supported baseline from exact `0.9.0` to bounded `0.10.x`, use `0.10.8` as the deterministic CI fixture, and normalize the documented JSON envelope at the test boundary. This addresses the observed failure while keeping the graph calls and plugin protocol unchanged.
