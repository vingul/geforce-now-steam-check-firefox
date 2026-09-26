@echo off
setlocal EnableExtensions
rem Build this fork of the extension and get it into Firefox on Windows.
rem
rem   scripts\install-local.cmd run    (default) build, then launch Firefox with the
rem                                    extension loaded via web-ext. Uses a "dev"
rem                                    profile next to this repo so settings and
rem                                    the Steam login persist; the add-on reloads
rem                                    on every start. No signing needed.
rem   scripts\install-local.cmd xpi    build and package an unsigned .xpi for a
rem                                    permanent install in Firefox Developer
rem                                    Edition / Nightly / ESR, or a temporary
rem                                    load in any Firefox via about:debugging.
rem   scripts\install-local.cmd sign   build and sign through AMO (unlisted) for a
rem                                    permanent install in release Firefox.
rem                                    Needs WEB_EXT_API_KEY / WEB_EXT_API_SECRET.
rem
rem Node.js 22+ is the only prerequisite. If it is missing (or older) the script
rem installs it with winget (built into Windows 10/11) and carries on. To check by
rem hand:  node -v
rem
rem Environment:
rem   ADDON_ID    override the add-on id in the built manifest (the stock id is the
rem               upstream author's AMO listing; signing a fork needs a new one).
rem   FIREFOX     path to firefox.exe for "run" mode (auto-detected when unset).
rem   SKIP_CHECK  set to 1 to skip typecheck + tests before building.

cd /d "%~dp0.."
set "MODE=%~1"
if "%MODE%"=="" set "MODE=run"

rem ---- Node.js 22+: install via winget when missing or too old -------------
set "NODE_MAJOR=0"
where node >nul 2>nul && for /f "usebackq" %%v in (`node -p "process.versions.node.split('.')[0]"`) do set "NODE_MAJOR=%%v"
if %NODE_MAJOR% GEQ 22 goto :node_ok

if %NODE_MAJOR% EQU 0 (
  echo ==^> Node.js not found - installing with winget
) else (
  echo ==^> Node.js %NODE_MAJOR%.x found, but 22+ is required - upgrading with winget
)
where winget >nul 2>nul || (
  echo error: winget is not available. Install Node.js 22+ from https://nodejs.org and re-run. 1>&2
  exit /b 1
)
call winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
rem winget updates the machine PATH, not this window's; add the default location
rem for the rest of this run so the build continues without reopening a terminal.
set "PATH=%ProgramFiles%\nodejs;%LOCALAPPDATA%\Programs\nodejs;%PATH%"
set "NODE_MAJOR=0"
where node >nul 2>nul && for /f "usebackq" %%v in (`node -p "process.versions.node.split('.')[0]"`) do set "NODE_MAJOR=%%v"
if %NODE_MAJOR% LSS 22 (
  echo error: Node.js 22+ still not on PATH. Open a new terminal and re-run this script. 1>&2
  exit /b 1
)
echo ==^> Node.js ready ^(open a new terminal for it to be on PATH there too^)

:node_ok

if not exist node_modules (
  echo ==^> installing dependencies ^(npm ci^)
  call npm ci --no-audit --no-fund || exit /b 1
)

if not "%SKIP_CHECK%"=="1" (
  echo ==^> typecheck + tests
  call npx tsc --noEmit || exit /b 1
  call npx tsc --noEmit -p tsconfig.node.json || exit /b 1
  call npx vitest run || exit /b 1
)

echo ==^> building dist\
call node build.mjs || exit /b 1

if not "%ADDON_ID%"=="" (
  echo ==^> setting add-on id to %ADDON_ID%
  call node -e "const fs=require('fs');const p='dist/manifest.json';const m=JSON.parse(fs.readFileSync(p,'utf8'));m.browser_specific_settings.gecko.id=process.env.ADDON_ID;fs.writeFileSync(p,JSON.stringify(m,null,2)+'\n');" || exit /b 1
)

for /f "usebackq" %%v in (`node -p "require('./dist/manifest.json').version"`) do set "VERSION=%%v"
for /f "usebackq" %%v in (`node -p "require('./dist/manifest.json').browser_specific_settings.gecko.id"`) do set "CURRENT_ID=%%v"

if /i "%MODE%"=="run" goto :run
if /i "%MODE%"=="xpi" goto :xpi
if /i "%MODE%"=="sign" goto :sign
echo usage: %~nx0 [run^|xpi^|sign] 1>&2
exit /b 2

:run
echo ==^> launching Firefox with the extension loaded ^(Ctrl+C to stop^)
echo.
echo     This is a SEPARATE Firefox window with its own profile ^(.firefox-dev-profile\^),
echo     not your everyday one: look for the add-on there, not in a Firefox that was
echo     already open. It opens on about:debugging ^(the add-on must be listed under
echo     "Temporary Extensions"^) and on a Steam game page that is on GeForce NOW.
echo     Firefox 128+ is required; below that web-ext prints an "incompatible" error
echo     right here and nothing is installed.
echo.
if not exist .firefox-dev-profile mkdir .firefox-dev-profile
set "WEBEXT_ARGS=run --source-dir dist --firefox-profile .firefox-dev-profile --keep-profile-changes --start-url "about:debugging#/runtime/this-firefox" --start-url "https://store.steampowered.com/app/1091500/""
if "%FIREFOX%"=="" (
  call npx web-ext %WEBEXT_ARGS%
) else (
  call npx web-ext %WEBEXT_ARGS% --firefox "%FIREFOX%"
)
exit /b %ERRORLEVEL%

:xpi
echo ==^> packaging
if not exist web-ext-artifacts mkdir web-ext-artifacts
call npx web-ext build --source-dir dist --artifacts-dir web-ext-artifacts --overwrite-dest >nul || exit /b 1
set "ZIP="
for /f "delims=" %%f in ('dir /b /o-d web-ext-artifacts\*.zip') do if not defined ZIP set "ZIP=%%f"
set "XPI=web-ext-artifacts\gfn-check-steam-%VERSION%.xpi"
copy /y "web-ext-artifacts\%ZIP%" "%XPI%" >nul || exit /b 1
echo.
echo Built: %XPI%  (add-on id: %CURRENT_ID%, unsigned)
echo.
echo Install permanently - Firefox Developer Edition, Nightly, or ESR only:
echo   1. about:config  -^>  set  xpinstall.signatures.required  to  false
echo   2. about:addons  -^>  gear icon  -^>  "Install Add-on From File..."  -^>  pick the .xpi
echo      (or drag the .xpi onto a Firefox window)
echo.
echo Any Firefox, temporary (unloads on restart):
echo   about:debugging#/runtime/this-firefox  -^>  "Load Temporary Add-on..."  -^>  pick %CD%\dist\manifest.json
echo.
echo Release Firefox refuses unsigned add-ons permanently; use  %~nx0 sign  for that.
exit /b 0

:sign
if "%WEB_EXT_API_KEY%"=="" (
  echo error: set WEB_EXT_API_KEY ^(AMO API credentials: https://addons.mozilla.org/developers/addon/api/key/^) 1>&2
  exit /b 1
)
if "%WEB_EXT_API_SECRET%"=="" (
  echo error: set WEB_EXT_API_SECRET 1>&2
  exit /b 1
)
echo ==^> signing via AMO ^(unlisted channel^) as %CURRENT_ID%
echo     note: if AMO rejects the id as already taken, re-run with ADDON_ID=^<new id^>
call npx web-ext sign --source-dir dist --channel unlisted --artifacts-dir web-ext-artifacts || exit /b 1
echo.
echo Signed .xpi is in web-ext-artifacts\. Install it in any Firefox:
echo   about:addons  -^>  gear icon  -^>  "Install Add-on From File..."  (or drag it onto a Firefox window)
exit /b 0
