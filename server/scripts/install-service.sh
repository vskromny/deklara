#!/bin/bash
# Install the API and nightly-maintenance launchd agents for the current user.
# Idempotent: re-run after moving the repo or upgrading node.
set -euo pipefail

SERVER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AGENTS="$HOME/Library/LaunchAgents"
API_LABEL="ch.kryptodeklara.api"
MAINT_LABEL="ch.kryptodeklara.maintenance"
PORT="${PORT:-8787}"

NODE_BIN="$(command -v node || true)"
if [ -z "$NODE_BIN" ]; then
  echo "node not found on PATH" >&2
  exit 1
fi

# launchd starts with a bare environment, so the interpreter must be an
# absolute path. nvm installs live under a versioned directory — upgrading node
# moves this path and would silently stop the service, so re-run this script
# after any node upgrade.
case "$NODE_BIN" in
  *"/.nvm/"*) echo "note: node is nvm-managed ($NODE_BIN) — re-run this script after upgrading node" ;;
esac

mkdir -p "$AGENTS" "$SERVER_DIR/logs" "$SERVER_DIR/data" "$SERVER_DIR/backups"
chmod 700 "$SERVER_DIR/data"

write_plist() {
  local label="$1" plist="$AGENTS/$1.plist"; shift
  cat > "$plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$label</string>
  <key>ProgramArguments</key>
  <array>
$(for arg in "$@"; do echo "    <string>$arg</string>"; done)
  </array>
  <key>WorkingDirectory</key><string>$SERVER_DIR</string>
  <key>StandardOutPath</key><string>$SERVER_DIR/logs/${label##*.}.log</string>
  <key>StandardErrorPath</key><string>$SERVER_DIR/logs/${label##*.}.log</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>/usr/bin:/bin:/usr/sbin:/sbin</string>
    <key>PORT</key><string>$PORT</string>
  </dict>
PLIST
  if [ "$label" = "$API_LABEL" ]; then
    cat >> "$plist" <<'PLIST'
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>5</integer>
PLIST
  else
    cat >> "$plist" <<'PLIST'
  <key>RunAtLoad</key><false/>
  <key>StartCalendarInterval</key>
  <dict><key>Hour</key><integer>4</integer><key>Minute</key><integer>15</integer></dict>
PLIST
  fi
  echo '</dict></plist>' >> "$plist"
}

reload() {
  local label="$1"
  launchctl bootout "gui/$UID/$label" 2>/dev/null || true
  launchctl bootstrap "gui/$UID" "$AGENTS/$label.plist"
}

write_plist "$API_LABEL" "$NODE_BIN" "--no-warnings" "$SERVER_DIR/src/server.js"
write_plist "$MAINT_LABEL" "/bin/bash" "$SERVER_DIR/scripts/maintenance.sh"

chmod +x "$SERVER_DIR/scripts/maintenance.sh"
reload "$API_LABEL"
reload "$MAINT_LABEL"

echo "installed:"
echo "  $API_LABEL    → node $SERVER_DIR/src/server.js on :$PORT (KeepAlive)"
echo "  $MAINT_LABEL  → nightly 04:15 backup + log rotation"
echo
echo "logs:   $SERVER_DIR/logs/"
echo "token:  $SERVER_DIR/data/admin-token.txt"
echo "remove: $SERVER_DIR/scripts/uninstall-service.sh"
