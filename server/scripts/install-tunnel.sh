#!/bin/bash
# Install the Cloudflare Tunnel as a *user* launchd agent.
#
# `cloudflared service install` would create a system daemon and needs sudo.
# A user agent avoids that and matches how ch.kryptodeklara.api already runs,
# so both services start and stop together with the same login session.
#
# The tunnel token lives in ~/.cloudflared/deklara-mini.token (mode 600) and is
# never written into the plist, which is world-readable.
set -euo pipefail

LABEL="ch.kryptodeklara.tunnel"
AGENTS="$HOME/Library/LaunchAgents"
TOKEN_FILE="$HOME/.cloudflared/deklara-mini.token"
SERVER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$SERVER_DIR/logs"

CLOUDFLARED="$(command -v cloudflared || true)"
[ -z "$CLOUDFLARED" ] && { echo "cloudflared not found — brew install cloudflared" >&2; exit 1; }
[ -f "$TOKEN_FILE" ] || { echo "no token at $TOKEN_FILE" >&2; exit 1; }

mkdir -p "$AGENTS" "$LOG_DIR"

# Wrapper so the token is read from the protected file at start time rather
# than baked into the plist.
cat > "$SERVER_DIR/scripts/run-tunnel.sh" <<WRAP
#!/bin/bash
exec "$CLOUDFLARED" --no-autoupdate tunnel run --token "\$(cat "$TOKEN_FILE")"
WRAP
chmod 700 "$SERVER_DIR/scripts/run-tunnel.sh"

cat > "$AGENTS/$LABEL.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$SERVER_DIR/scripts/run-tunnel.sh</string>
  </array>
  <key>WorkingDirectory</key><string>$SERVER_DIR</string>
  <key>StandardOutPath</key><string>$LOG_DIR/tunnel.log</string>
  <key>StandardErrorPath</key><string>$LOG_DIR/tunnel.log</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>10</integer>
  <key>EnvironmentVariables</key>
  <dict><key>PATH</key><string>/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin</string></dict>
</dict>
</plist>
PLIST

launchctl bootout "gui/$UID/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$UID" "$AGENTS/$LABEL.plist"

echo "installed $LABEL"
echo "  cloudflared: $CLOUDFLARED"
echo "  log:         $LOG_DIR/tunnel.log"
