#!/usr/bin/env bash
# Build this fork of the extension and get it into Firefox on this machine.
#
#   scripts/install-local.sh run    # (default) build, then launch Firefox with the
#                                   # extension loaded via web-ext. Uses the "dev"
#                                   # profile next to this repo so your settings and
#                                   # Steam login persist between runs; the add-on
#                                   # is reloaded on every start. No signing needed.
#   scripts/install-local.sh xpi    # build and package an unsigned .xpi you can
#                                   # install permanently in Firefox Developer
#                                   # Edition / Nightly / ESR (see notes printed at
#                                   # the end), or load temporarily in any Firefox
#                                   # via about:debugging.
#   scripts/install-local.sh sign   # build and sign through AMO (unlisted channel)
#                                   # for a permanent install in *release* Firefox.
#                                   # Needs WEB_EXT_API_KEY / WEB_EXT_API_SECRET.
#
# Environment:
#   ADDON_ID=<id>       override browser_specific_settings.gecko.id in the built
#                       manifest. The stock id belongs to the upstream author's
#                       AMO listing, so signing this fork under your own account
#                       needs a fresh id (e.g. gfn-check-fork@yourname). Also lets
#                       the fork coexist with the AMO version.
#   FIREFOX=<path>      Firefox binary (or "firefoxdeveloperedition", "nightly") to
#                       launch in `run` mode; web-ext auto-detects when unset.
#   SKIP_CHECK=1        skip typecheck + tests before building.
set -euo pipefail

cd "$(dirname "$0")/.."
mode="${1:-run}"

need() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "error: '$1' not found. Install Node.js 22+ (https://nodejs.org) or run 'mise install' (mise.toml pins it)." >&2
    exit 1
  }
}
need node
need npm

node_major="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$node_major" -lt 22 ]; then
  echo "error: Node.js 22+ required, found $(node -v)" >&2
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "==> installing dependencies (npm ci)"
  npm ci --no-audit --no-fund
fi

if [ "${SKIP_CHECK:-0}" != "1" ]; then
  echo "==> typecheck + tests"
  npx tsc --noEmit
  npx tsc --noEmit -p tsconfig.node.json
  npx vitest run
fi

echo "==> building dist/"
node build.mjs

if [ -n "${ADDON_ID:-}" ]; then
  echo "==> setting add-on id to ${ADDON_ID}"
  ADDON_ID="$ADDON_ID" node -e '
    const fs = require("fs");
    const p = "dist/manifest.json";
    const m = JSON.parse(fs.readFileSync(p, "utf8"));
    m.browser_specific_settings.gecko.id = process.env.ADDON_ID;
    fs.writeFileSync(p, JSON.stringify(m, null, 2) + "\n");
  '
fi

version="$(node -p "require('./dist/manifest.json').version")"
addon_id="$(node -p "require('./dist/manifest.json').browser_specific_settings.gecko.id")"

case "$mode" in
  run)
    echo "==> launching Firefox with the extension loaded (Ctrl+C to stop)"
    mkdir -p .firefox-dev-profile
    args=(run --source-dir dist --firefox-profile .firefox-dev-profile --keep-profile-changes)
    [ -n "${FIREFOX:-}" ] && args+=(--firefox "$FIREFOX")
    exec npx web-ext "${args[@]}"
    ;;
  xpi)
    echo "==> packaging"
    mkdir -p web-ext-artifacts
    npx web-ext build --source-dir dist --artifacts-dir web-ext-artifacts --overwrite-dest >/dev/null
    zip="$(ls -t web-ext-artifacts/*.zip | head -n 1)"
    xpi="web-ext-artifacts/gfn-check-steam-${version}.xpi"
    cp "$zip" "$xpi"
    cat <<MSG

Built: $xpi  (add-on id: $addon_id, unsigned)

Install permanently — Firefox Developer Edition, Nightly, or ESR only:
  1. about:config → set  xpinstall.signatures.required  to  false
  2. about:addons → gear icon → "Install Add-on From File…" → pick the .xpi
     (or just drag the .xpi onto a Firefox window)

Any Firefox, temporary (unloads on restart):
  about:debugging#/runtime/this-firefox → "Load Temporary Add-on…" → pick $PWD/dist/manifest.json

Release Firefox refuses unsigned add-ons permanently; use  $0 sign  for that.
MSG
    ;;
  sign)
    : "${WEB_EXT_API_KEY:?set WEB_EXT_API_KEY (AMO API credentials: https://addons.mozilla.org/developers/addon/api/key/)}"
    : "${WEB_EXT_API_SECRET:?set WEB_EXT_API_SECRET}"
    echo "==> signing via AMO (unlisted channel) as ${addon_id}"
    echo "    note: if AMO rejects the id as already taken, re-run with ADDON_ID=<new id>"
    npx web-ext sign --source-dir dist --channel unlisted --artifacts-dir web-ext-artifacts
    cat <<MSG

Signed .xpi is in web-ext-artifacts/. Install it in any Firefox:
  about:addons → gear icon → "Install Add-on From File…" (or drag it onto a Firefox window)
MSG
    ;;
  *)
    echo "usage: $0 [run|xpi|sign]" >&2
    exit 2
    ;;
esac
