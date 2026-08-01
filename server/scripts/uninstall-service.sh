#!/bin/bash
# Remove both launchd agents. Leaves data/, logs/ and backups/ untouched.
set -euo pipefail

AGENTS="$HOME/Library/LaunchAgents"

for label in ch.kryptodeklara.api ch.kryptodeklara.maintenance; do
  launchctl bootout "gui/$UID/$label" 2>/dev/null || true
  rm -f "$AGENTS/$label.plist"
  echo "removed $label"
done

echo
echo "Data left in place. Delete it yourself if you mean to:"
echo "  server/data  server/logs  server/backups"
