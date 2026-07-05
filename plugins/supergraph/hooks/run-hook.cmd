: << 'CMDBLOCK'
@echo off
set HOOK_NAME=%1
set "PLUGIN_ROOT=%CLAUDE_PLUGIN_ROOT%"
if "%PLUGIN_ROOT%"=="" set "PLUGIN_ROOT=%ANTIGRAVITY_PLUGIN_ROOT%"
if "%PLUGIN_ROOT%"=="" set "PLUGIN_ROOT=%AGY_PLUGIN_ROOT%"
if "%PLUGIN_ROOT%"=="" set "PLUGIN_ROOT=%GEMINI_PLUGIN_ROOT%"
if "%PLUGIN_ROOT%"=="" (
  echo Missing plugin root env var >&2
  exit /b 1
)
"C:\Program Files\Git\bin\bash.exe" -l -c "\"$(cygpath -u \"%PLUGIN_ROOT%\")/hooks/%HOOK_NAME%\""
exit /b %ERRORLEVEL%
CMDBLOCK

# Unix shell runs from here
HOOK_NAME="$1"
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-${ANTIGRAVITY_PLUGIN_ROOT:-${AGY_PLUGIN_ROOT:-${GEMINI_PLUGIN_ROOT:-}}}}"
if [ -z "$PLUGIN_ROOT" ]; then
  echo "Missing plugin root env var" >&2
  exit 1
fi
"${PLUGIN_ROOT}/hooks/${HOOK_NAME}"
