#!/bin/bash
# Nightly upkeep: back up the database, rotate logs, prune both.
# Run by the ch.kryptodeklara.maintenance launchd agent.
set -euo pipefail

SERVER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_PATH="${DB_PATH:-$SERVER_DIR/data/deklara.db}"
BACKUP_DIR="${BACKUP_DIR:-$SERVER_DIR/backups}"
LOG_DIR="${LOG_DIR:-$SERVER_DIR/logs}"
KEEP_DAYS="${KEEP_DAYS:-14}"

mkdir -p "$BACKUP_DIR" "$LOG_DIR"
stamp="$(date +%Y-%m-%d)"

# .backup is safe on a live database — it takes a consistent snapshot rather
# than copying a file that may be mid-write. Copying deklara.db directly while
# the server is running can yield a corrupt backup.
if [ -f "$DB_PATH" ]; then
  /usr/bin/sqlite3 "$DB_PATH" ".backup '$BACKUP_DIR/deklara-$stamp.db'"
  gzip -f "$BACKUP_DIR/deklara-$stamp.db"
  echo "[$(date -Iseconds)] backup ok: deklara-$stamp.db.gz"

  # Verify the snapshot actually opens, so a silently broken backup does not
  # sit there for weeks looking like protection.
  if ! gunzip -c "$BACKUP_DIR/deklara-$stamp.db.gz" > "/tmp/verify-$stamp.db" 2>/dev/null \
     || ! /usr/bin/sqlite3 "/tmp/verify-$stamp.db" "pragma integrity_check;" | grep -q '^ok$'; then
    echo "[$(date -Iseconds)] BACKUP VERIFY FAILED for deklara-$stamp.db.gz" >&2
  fi
  rm -f "/tmp/verify-$stamp.db"
else
  echo "[$(date -Iseconds)] no database at $DB_PATH, nothing to back up"
fi

# Rotate the current log, keeping the server writing to a fresh file. The
# service reopens its stdout on the next write, so a plain move is enough.
for name in api maintenance; do
  log="$LOG_DIR/$name.log"
  if [ -f "$log" ] && [ "$(stat -f%z "$log")" -gt 1048576 ]; then
    mv "$log" "$LOG_DIR/$name-$stamp.log"
    gzip -f "$LOG_DIR/$name-$stamp.log"
    echo "[$(date -Iseconds)] rotated $name.log"
  fi
done

find "$BACKUP_DIR" -name 'deklara-*.db.gz' -type f -mtime "+$KEEP_DAYS" -delete
find "$LOG_DIR" -name '*.log.gz' -type f -mtime "+$KEEP_DAYS" -delete

echo "[$(date -Iseconds)] maintenance done (keeping $KEEP_DAYS days)"
