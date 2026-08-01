#!/bin/bash
exec "/opt/homebrew/bin/cloudflared" --no-autoupdate tunnel run --token "$(cat "/Users/skyvir20/.cloudflared/deklara-mini.token")"
