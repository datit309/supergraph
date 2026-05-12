: << 'CMDBLOCK'
@echo off
set HOOK_NAME=%1
"C:\Program Files\Git\bin\bash.exe" -l -c "\"$(cygpath -u \"%CLAUDE_PLUGIN_ROOT%\")/hooks/%HOOK_NAME%\""
exit /b %ERRORLEVEL%
CMDBLOCK

# Unix shell runs from here
HOOK_NAME="$1"
"${CLAUDE_PLUGIN_ROOT}/hooks/${HOOK_NAME}"
