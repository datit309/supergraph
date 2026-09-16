#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)

fail() {
  printf 'FAIL: %s\n' "$*" >&2
  exit 1
}

paths=(
  "plugins/supergraph/skills/design-taste-frontend/SKILL.md"
  "plugins/supergraph/skills/gpt-taste/SKILL.md"
  "plugins/supergraph/skills/redesign-existing-projects/SKILL.md"
  "plugins/supergraph/skills/image-to-code/SKILL.md"
)

names=(
  "design-taste-frontend"
  "gpt-taste"
  "redesign-existing-projects"
  "image-to-code"
)

hashes=(
  "aa194351b246b8b4799099d4ed7b033d29eab6e6e3d58d8d2172978be7b3ec89"
  "2e64c269953f2656c21bf5a0fa6b4568e82fe0c72b36e8f84758e090349966a5"
  "98ad3e5b051bfb71b2795f7e8a6aa0d32b51ee095606c098a4b2822ac07926c9"
  "4c060a8064a8b13380bc2ef3d6e6a1d0b1e316aa093cd9807d0ce9e4eeb037fa"
)

hash_file() {
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
  else
    sha256sum "$1" | awk '{print $1}'
  fi
}

for index in "${!paths[@]}"; do
  path=${paths[$index]}
  expected_name=${names[$index]}
  expected_hash=${hashes[$index]}
  file="$ROOT/$path"

  test -f "$file" || fail "missing imported skill: $path"
  test "$(sed -n '1p' "$file")" = "---" || fail "missing frontmatter start: $path"
  awk 'NR > 1 && $0 == "---" { found=1; exit } END { exit(found ? 0 : 1) }' "$file" \
    || fail "missing frontmatter end: $path"

  frontmatter=$(awk '
    NR == 1 { next }
    $0 == "---" { exit }
    { print }
  ' "$file")
  name_count=$(printf '%s\n' "$frontmatter" | awk '/^name:/{count++} END{print count+0}')
  description_count=$(printf '%s\n' "$frontmatter" | awk '/^description:/{count++} END{print count+0}')
  actual_name=$(printf '%s\n' "$frontmatter" | awk -F': ' '/^name:/{print $2; exit}')

  test "$name_count" -eq 1 || fail "frontmatter must have one name: $path"
  test "$description_count" -eq 1 || fail "frontmatter must have one description: $path"
  test "$actual_name" = "$expected_name" || fail "expected name $expected_name, got $actual_name in $path"
  actual_hash=$(hash_file "$file")
  test "$actual_hash" = "$expected_hash" || fail "source hash mismatch for $path"
done

test ! -e "$ROOT/plugins/supergraph/skills/design-taste-frontend/README.md" \
  || fail "unexpected untracked wrapper file in core skill"
printf 'PASS: Taste Skill canonical registration contract\n'
