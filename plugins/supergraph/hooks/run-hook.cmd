: << 'CMDBLOCK'
@echo off
set HOOK_NAME=%1
set "PLUGIN_ROOT=%~dp0.."
set "GIT_BASH="
if defined CLAUDE_CODE_GIT_BASH_PATH if exist "%CLAUDE_CODE_GIT_BASH_PATH%" if not exist "%CLAUDE_CODE_GIT_BASH_PATH%\NUL" set "GIT_BASH=%CLAUDE_CODE_GIT_BASH_PATH%"
if not defined GIT_BASH if exist "%ProgramFiles%\Git\bin\bash.exe" set "GIT_BASH=%ProgramFiles%\Git\bin\bash.exe"
if not defined GIT_BASH if exist "%LocalAppData%\Programs\Git\bin\bash.exe" set "GIT_BASH=%LocalAppData%\Programs\Git\bin\bash.exe"
if not defined GIT_BASH for /f "delims=" %%i in ('where git.exe 2^>nul') do (
  if not defined GIT_BASH if exist "%%~dpi..\bin\bash.exe" set "GIT_BASH=%%~dpi..\bin\bash.exe"
)
if not defined GIT_BASH (
  echo supergraph: Git Bash not found — hooks skipped 1>&2
  exit /b 0
)
"%GIT_BASH%" -l -c "\"$(cygpath -u \"%PLUGIN_ROOT%\")/hooks/%HOOK_NAME%\""
exit /b %ERRORLEVEL%
CMDBLOCK

# Unix shell runs from here
HOOK_NAME="$1"
PLUGIN_ROOT=$(cd "$(dirname "$0")/.." && pwd)
"${PLUGIN_ROOT}/hooks/${HOOK_NAME}"
