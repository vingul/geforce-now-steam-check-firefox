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
# Node.js 22+ is the only prerequisite. If it is missing (or older), the script
# installs it — Homebrew on a Mac that has it, nvm everywhere else — and carries
# on in the same run. To check by hand:  node -v
#
# Environment:
#   ADDON_ID=<id>       override browser_specific_settings.gecko.id in the built
#                       manifest. The stock id belongs to the upstream author's
#                       AMO listing, so signing this fork under your own account
#                       needs a fresh id (e.g. gfn-check-fork@yourname). Also lets
#                       the fork coexist with the AMO version.
#   ADDON_VERSION=<v>   override the manifest version in the build. AMO signs a
#                       given add-on version only once, so each re-sign of a
#                       changed build needs a new one (e.g. 1.0.1, 1.0.2 …).
#   FIREFOX=<path>      Firefox binary (or "firefoxdeveloperedition", "nightly") to
#                       launch in `run` mode; web-ext auto-detects when unset.
#   SKIP_CHECK=1        skip typecheck + tests before building.
#   All of these may also be put in .amo-credentials (KEY=value per line) at the
#   repo root, alongside WEB_EXT_API_KEY / WEB_EXT_API_SECRET for `sign`.
set -euo pipefail

cd "$(dirname "$0")/.."
mode="${1:-run}"

# Credentials and overrides can live in .amo-credentials at the repo root
# (gitignored; see .amo-credentials.example) instead of the environment, which
# is easier than exporting variables in whichever shell you happen to be in.
# Environment variables already set take precedence over the file.
if [ -f .amo-credentials ]; then
  while IFS='=' read -r key value || [ -n "$key" ]; do
    key="${key%%[[:space:]]*}"
    case "$key" in ''|'#'*) continue ;; esac
    value="${value%$'\r'}"
    if [ -z "${!key:-}" ]; then export "$key=$value"; fi
  done < .amo-credentials
fi

NODE_MAJOR_REQUIRED=22

node_ok() {
  command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1 &&
    [ "$(node -p 'process.versions.node.split(".")[0]')" -ge "$NODE_MAJOR_REQUIRED" ]
}

# Install Node.js when it is missing or too old. Homebrew on a Mac that has it;
# otherwise nvm (https://github.com/nvm-sh/nvm), which needs no sudo and does not
# touch a system Node. Either way the new binary is put on this script's PATH so
# the build continues in the same run.
# A Node installed by nvm lives outside PATH until the shell sources nvm.sh — a
# fresh terminal, or a shell whose rc file nvm's installer did not know about,
# never sees it. Pick it up quietly before concluding Node is missing.
load_nvm_node() {
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  [ -s "$NVM_DIR/nvm.sh" ] || return 1
  set +eu
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh" --no-use
  nvm use "$NODE_MAJOR_REQUIRED" >/dev/null 2>&1
  set -eu
  node_ok
}

ensure_node() {
  node_ok && return 0
  load_nvm_node && return 0
  if command -v node >/dev/null 2>&1; then
    echo "==> Node.js $(node -v) found, but ${NODE_MAJOR_REQUIRED}+ is required — installing"
  else
    echo "==> Node.js not found — installing"
  fi

  if [ "$(uname -s)" = "Darwin" ] && command -v brew >/dev/null 2>&1; then
    brew install "node@${NODE_MAJOR_REQUIRED}"
    export PATH="$(brew --prefix "node@${NODE_MAJOR_REQUIRED}")/bin:$PATH"
    node_ok && return 0
    echo "warning: Homebrew node@${NODE_MAJOR_REQUIRED} did not end up on PATH; falling back to nvm" >&2
  fi

  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    command -v curl >/dev/null 2>&1 || {
      echo "error: curl is needed to download nvm. Install curl, or install Node.js ${NODE_MAJOR_REQUIRED}+ from https://nodejs.org and re-run." >&2
      exit 1
    }
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  fi
  # nvm's own functions are not written for `set -eu`: sourcing it, and its
  # install/use, trip on unset variables and non-zero probes. Relax both only for
  # the nvm calls, then restore.
  set +eu
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh" --no-use
  nvm install "$NODE_MAJOR_REQUIRED" && nvm use "$NODE_MAJOR_REQUIRED" >/dev/null
  nvm_status=$?
  set -eu
  [ "$nvm_status" -eq 0 ] || {
    echo "error: nvm could not install Node.js ${NODE_MAJOR_REQUIRED}. Install it from https://nodejs.org and re-run." >&2
    exit 1
  }

  node_ok || {
    echo "error: Node.js ${NODE_MAJOR_REQUIRED}+ still not available. Install it from https://nodejs.org and re-run." >&2
    exit 1
  }
  echo "==> Node.js $(node -v) ready (open a new terminal for it to be on PATH there too)"
}
ensure_node

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

if [ -n "${ADDON_ID:-}${ADDON_VERSION:-}" ]; then
  [ -n "${ADDON_ID:-}" ] && echo "==> setting add-on id to ${ADDON_ID}"
  [ -n "${ADDON_VERSION:-}" ] && echo "==> setting add-on version to ${ADDON_VERSION}"
  ADDON_ID="${ADDON_ID:-}" ADDON_VERSION="${ADDON_VERSION:-}" node -e '
    const fs = require("fs");
    const p = "dist/manifest.json";
    const m = JSON.parse(fs.readFileSync(p, "utf8"));
    if (process.env.ADDON_ID) m.browser_specific_settings.gecko.id = process.env.ADDON_ID;
    if (process.env.ADDON_VERSION) m.version = process.env.ADDON_VERSION;
    fs.writeFileSync(p, JSON.stringify(m, null, 2) + "\n");
  '
fi

version="$(node -p "require('./dist/manifest.json').version")"
addon_id="$(node -p "require('./dist/manifest.json').browser_specific_settings.gecko.id")"

case "$mode" in
  run)
    cat <<MSG
==> launching Firefox with the extension loaded (Ctrl+C to stop)

    This is a SEPARATE Firefox window with its own profile (.firefox-dev-profile/),
    not your everyday one: look for the add-on there, not in a Firefox that was
    already open. It opens on about:debugging (the add-on must be listed under
    "Temporary Extensions") and on a Steam game page that is on GeForce NOW.
    Firefox 128+ is required; below that web-ext prints an "incompatible" error
    right here and nothing is installed.

MSG
    # Absolute path on purpose: web-ext hands the value to fx-runner unresolved,
    # and fx-runner treats anything without a slash as a profile *name* (-P),
    # which Firefox silently resolves to your default profile when no such name
    # exists — the add-on then never installs and web-ext cannot connect.
    profile_dir="$PWD/.firefox-dev-profile"
    mkdir -p "$profile_dir"
    args=(run --source-dir dist --firefox-profile "$profile_dir" --keep-profile-changes
      --start-url "about:debugging#/runtime/this-firefox"
      --start-url "https://store.steampowered.com/app/1091500/")
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
    if [ -z "${WEB_EXT_API_KEY:-}" ] || [ -z "${WEB_EXT_API_SECRET:-}" ]; then
      cat >&2 <<MSG
error: AMO API credentials not found.
       Put them in .amo-credentials at the repo root (copy .amo-credentials.example),
       or export WEB_EXT_API_KEY and WEB_EXT_API_SECRET in this shell.
       Keys: https://addons.mozilla.org/developers/addon/api/key/
MSG
      exit 1
    fi
    echo "==> signing via AMO (unlisted channel) as ${addon_id}"
    echo "    note: if AMO rejects the id as already taken, re-run with ADDON_ID=<new id>;"
    echo "          if it says this version already exists, re-run with ADDON_VERSION=<new version>"
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
