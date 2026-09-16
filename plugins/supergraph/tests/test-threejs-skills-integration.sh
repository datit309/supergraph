#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)
SOURCE_REPOSITORY='https://github.com/cloudai-x/threejs-skills'
SOURCE_COMMIT='b1c623076c661fc9b03dac19292e825a5d106823'

fail() {
  printf 'FAIL: %s\n' "$*" >&2
  exit 1
}

paths=(
  "plugins/supergraph/skills/threejs-animation/SKILL.md"
  "plugins/supergraph/skills/threejs-fundamentals/SKILL.md"
  "plugins/supergraph/skills/threejs-geometry/SKILL.md"
  "plugins/supergraph/skills/threejs-interaction/SKILL.md"
  "plugins/supergraph/skills/threejs-lighting/SKILL.md"
  "plugins/supergraph/skills/threejs-loaders/SKILL.md"
  "plugins/supergraph/skills/threejs-materials/SKILL.md"
  "plugins/supergraph/skills/threejs-postprocessing/SKILL.md"
  "plugins/supergraph/skills/threejs-shaders/SKILL.md"
  "plugins/supergraph/skills/threejs-textures/SKILL.md"
)

names=(
  "threejs-animation"
  "threejs-fundamentals"
  "threejs-geometry"
  "threejs-interaction"
  "threejs-lighting"
  "threejs-loaders"
  "threejs-materials"
  "threejs-postprocessing"
  "threejs-shaders"
  "threejs-textures"
)

hashes=(
  "b24dc96c7a854ab97fa797a8e20d6bf981f155dfc625fd1ef347042395b7754c"
  "eb66d52f53f489067d602b9b62df507adb391d8220bdd1a8aae6b73e6cee578a"
  "8337bcf86621411f54ef39727b338c84890815e4b3612ce635d593dd9c321a3e"
  "1bb23f0388d39863432494ff00ea0a96ae7d093c0c6f3149fb223ba1e673fef6"
  "777875f7d6a75219d009ac69310772236231eec7cb57287c0509bb53e994af9d"
  "03e0d7319692bb7eaa13cfada5d27d39840c7520c5ddc3fc8cc07b645dcba2e9"
  "d5846d1b8254b903eacb3014486efbe331101518604b451098fd31989c3e7fe7"
  "570b86434c30ad9bdc30f4f6d4e8c04124a07dd4ccaa778d4717ecc211dc1d90"
  "6702267bd3ee70d458b54078211db36b1c3738c3faa0570e88e33dceaf478a4d"
  "2a90ce70931e9b172fa5b70c13fd12e7b6f1600482d3ba0c73d95570fe728b65"
)

hash_file() {
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
  else
    sha256sum "$1" | awk '{print $1}'
  fi
}

skill_root="$ROOT/plugins/supergraph/skills"
actual_dir_count=$(find "$skill_root" -maxdepth 1 -type d -name 'threejs-*' -print | wc -l | tr -d ' ')
test "$actual_dir_count" -eq "${#paths[@]}" \
  || fail "expected exactly ${#paths[@]} Three.js skill directories, found $actual_dir_count"

for index in "${!paths[@]}"; do
  path=${paths[$index]}
  expected_name=${names[$index]}
  expected_hash=${hashes[$index]}
  file="$ROOT/$path"
  skill_dir=$(dirname "$file")

  test -d "$skill_dir" || fail "missing imported skill directory: $skill_dir"
  test ! -L "$skill_dir" || fail "skill directory must not be a symlink: $skill_dir"
  test -f "$file" || fail "missing imported skill: $path"
  test ! -L "$file" || fail "skill file must not be a symlink: $path"

  extra_entries=$(find "$skill_dir" -mindepth 1 -maxdepth 1 ! -name 'SKILL.md' -print)
  test -z "$extra_entries" || fail "unexpected extra entry in $skill_dir: $extra_entries"
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
  test "$actual_name" = "$expected_name" \
    || fail "expected name $expected_name, got $actual_name in $path"
  actual_hash=$(hash_file "$file")
  test "$actual_hash" = "$expected_hash" \
    || fail "source hash mismatch for $path from $SOURCE_REPOSITORY@$SOURCE_COMMIT"
done

printf 'PASS: Three.js canonical registration contract (%s)\n' "$SOURCE_COMMIT"
