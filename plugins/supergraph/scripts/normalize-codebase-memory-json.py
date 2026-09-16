#!/usr/bin/env python3
"""Normalize Codebase Memory CLI output to its structured JSON payload."""

from __future__ import annotations

import json
import sys
from typing import Any


def _scalar(token: str) -> Any:
    try:
        return json.loads(token)
    except json.JSONDecodeError:
        return token


def _rendered_rows(rendered: str) -> dict[str, list[list[Any]]]:
    lines = rendered.strip("\n").splitlines()
    if not lines or not lines[0].startswith("rows:"):
        raise ValueError("unsupported human-readable Codebase Memory response")

    columns: list[str] = []
    if "(cols:" in lines[0]:
        columns = lines[0].partition("(cols:")[2].rstrip(")").split()

    rows: list[list[Any]] = []
    for line in lines[1:]:
        stripped = line.strip()
        if not stripped or stripped.startswith("total:") or not line.startswith("  "):
            continue
        tokens = stripped.split()
        if columns and len(tokens) < len(columns):
            raise ValueError("query row has fewer values than its columns")
        if columns and len(tokens) > len(columns):
            tokens = tokens[: len(columns) - 1] + [" ".join(tokens[len(columns) - 1 :])]
        rows.append([_scalar(token) for token in tokens])
    return {"rows": rows}


def normalize(raw: str) -> Any:
    value, _ = json.JSONDecoder().raw_decode(raw.lstrip())
    if isinstance(value, dict) and value.get("isError") is True:
        raise ValueError("Codebase Memory returned an error envelope")
    if isinstance(value, dict) and isinstance(value.get("structuredContent"), dict):
        return value["structuredContent"]
    if isinstance(value, dict) and isinstance(value.get("content"), list) and value["content"]:
        rendered = value["content"][0].get("text", "")
        try:
            return json.loads(rendered)
        except json.JSONDecodeError:
            return _rendered_rows(rendered)
    return value


if __name__ == "__main__":
    try:
        normalized = normalize(sys.stdin.read())
    except (json.JSONDecodeError, ValueError) as exc:
        raise SystemExit(f"invalid Codebase Memory response: {exc}") from exc
    print(json.dumps(normalized, separators=(",", ":")))
