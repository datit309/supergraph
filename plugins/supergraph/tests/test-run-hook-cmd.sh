#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
CMD="$ROOT/hooks/run-hook.cmd"
WINDOWS_BLOCK=$(awk '/^CMDBLOCK$/{exit} {print}' "$CMD")

fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }
contains() { grep -Fq -- "$1" <<<"$WINDOWS_BLOCK" || fail "missing marker: $1"; }
before() {
  local first second
  first=$(grep -nF -- "$1" <<<"$WINDOWS_BLOCK" | head -1 | cut -d: -f1)
  second=$(grep -nF -- "$2" <<<"$WINDOWS_BLOCK" | head -1 | cut -d: -f1)
  [[ -n "$first" && -n "$second" && "$first" -lt "$second" ]] || fail "resolver order: $1 before $2"
}

[[ -s "$CMD" ]] || fail "run-hook.cmd missing"
! grep -Fq '"C:\\Program Files\\Git\\bin\\bash.exe"' <<<"$WINDOWS_BLOCK" \
  || fail 'hardcoded Program Files Bash remains'
contains 'if defined CLAUDE_CODE_GIT_BASH_PATH'
contains 'if exist "%CLAUDE_CODE_GIT_BASH_PATH%"'
contains 'if exist "%ProgramFiles%\Git\bin\bash.exe"'
contains 'if exist "%LocalAppData%\Programs\Git\bin\bash.exe"'
contains "where git.exe"
contains '%%~dpi..\bin\bash.exe'
contains 'supergraph: Git Bash not found — hooks skipped'
contains 'exit /b 0'
contains '"%GIT_BASH%" -l -c'
contains 'cygpath -u'
contains '%PLUGIN_ROOT%'
before 'if defined CLAUDE_CODE_GIT_BASH_PATH' 'if exist "%ProgramFiles%\Git\bin\bash.exe"'
before 'if exist "%ProgramFiles%\Git\bin\bash.exe"' 'if exist "%LocalAppData%\Programs\Git\bin\bash.exe"'
before 'if exist "%LocalAppData%\Programs\Git\bin\bash.exe"' 'where git.exe'
printf 'PASS: Windows hook resolver contract\n'
