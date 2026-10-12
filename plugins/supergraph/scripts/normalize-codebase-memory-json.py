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


def _parse_rendered(rendered: str) -> Any:
    lines = rendered.strip("\n").splitlines()
    if not lines:
        raise ValueError("empty rendered content")
    if lines[0].startswith("rows:"):
        return _rendered_rows(rendered)

    result: dict[str, Any] = {}
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line.strip() or line.startswith("  ") or ":" not in line:
            i += 1
            continue
        key, _, val = line.partition(":")
        key = key.strip()
        val = val.strip()

        indented: list[str] = []
        j = i + 1
        while j < len(lines) and (lines[j].startswith("  ") or not lines[j].strip()):
            if lines[j].strip():
                indented.append(lines[j])
            j += 1
        i = j

        if "(cols:" in val:
            cols = val.partition("(cols:")[2].rstrip(")").split()
            table_rows: list[list[Any]] = []
            for row_line in indented:
                s = row_line.strip()
                tokens = s.split()
                if cols and len(tokens) > len(cols):
                    tokens = tokens[: len(cols) - 1] + [" ".join(tokens[len(cols) - 1 :])]
                table_rows.append([_scalar(t) for t in tokens])
            result[key] = table_rows
        elif indented:
            if indented[0].strip().startswith("- "):
                result[key] = [l.strip()[2:] for l in indented]
            else:
                sub_dict: dict[str, Any] = {}
                for l in indented:
                    if ":" in l:
                        sk, _, sv = l.partition(":")
                        sub_dict[sk.strip()] = _scalar(sv.strip())
                result[key] = sub_dict
        else:
            result[key] = _scalar(val)
    if not result:
        raise ValueError("unsupported human-readable Codebase Memory response")
    return result


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
            return _parse_rendered(rendered)
    return value


if __name__ == "__main__":
    try:
        normalized = normalize(sys.stdin.read())
    except (json.JSONDecodeError, ValueError) as exc:
        raise SystemExit(f"invalid Codebase Memory response: {exc}") from exc
    print(json.dumps(normalized, separators=(",", ":")))
