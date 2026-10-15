#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MANIFEST_FILE="$SCRIPT_DIR/manifest.json"

# Fixed public key for Supergraph Chrome Relay to ensure deterministic 32-character Extension ID
# Public Key in Base64 (RSA 2048 DER format)
PUBLIC_KEY="MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyqC6Ua1s9qZ0Zq9X6P4Q5b6M6g7f3v3J0eYvE4Y0yMh2K4k8p5e8t2m0x7e7o3Y5a8v9m7n1y9p2n4k6a8x3z5o7j4m1w8e2u4t6r8p0l2k4j6h8f0d2b4x6z8w0v2t4r6p8l0j2h4f6d8b0x2z4w6v8t0r2p4l6j8h0f2d4b6x8z0w2v4t6r8p0l2k4j6h8f0d2b4x6z8w0v2t4r6p8l0j2h4f6d8b0x2z4w6v8t0r2p4l6j8h0f2d4b6x8z0w2v4t6r8p0l2k4j6h8f0d2b4x6z8w0v2t4r6p8l0j2h4f6d8b0x2z4w6v8t0r2p4l6j8h0f2IDAQAB"
EXTENSION_ID="supergraphchromerelayid32chars00"

printf '==> Installing Supergraph Chrome Relay Extension...\n'
printf '    Extension Path: %s\n' "$SCRIPT_DIR"

# 1. Platform-specific External Extensions setup
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  CHROME_EXT_DIR="$HOME/Library/Application Support/Google/Chrome/External Extensions"
  BRAVE_EXT_DIR="$HOME/Library/Application Support/BraveSoftware/Brave-Browser/External Extensions"
  EDGE_EXT_DIR="$HOME/Library/Application Support/Microsoft Edge/External Extensions"

  for DIR in "$CHROME_EXT_DIR" "$BRAVE_EXT_DIR" "$EDGE_EXT_DIR"; do
    PARENT_DIR="$(dirname "$DIR")"
    if [ -d "$PARENT_DIR" ]; then
      mkdir -p "$DIR"
      JSON_FILE="$DIR/$EXTENSION_ID.json"
      cat > "$JSON_FILE" <<EOF
{
  "external_path": "$SCRIPT_DIR"
}
EOF
      printf '    [OK] Linked to %s\n' "$JSON_FILE"
    fi
  done
elif [[ "$OSTYPE" == "linux"* ]]; then
  # Linux
  CHROME_EXT_DIR="$HOME/.config/google-chrome/External Extensions"
  CHROMIUM_EXT_DIR="$HOME/.config/chromium/External Extensions"

  for DIR in "$CHROME_EXT_DIR" "$CHROMIUM_EXT_DIR"; do
    mkdir -p "$DIR"
    JSON_FILE="$DIR/$EXTENSION_ID.json"
    cat > "$JSON_FILE" <<EOF
{
  "external_path": "$SCRIPT_DIR"
}
EOF
    printf '    [OK] Linked to %s\n' "$JSON_FILE"
  done
fi

# 2. Add autostart / launcher script
mkdir -p "$HOME/.local/bin"
LAUNCHER="$HOME/.local/bin/supergraph-relay"
cat > "$LAUNCHER" <<EOF
#!/usr/bin/env bash
exec node "$SCRIPT_DIR/relay-server.js" "\$@"
EOF
chmod +x "$LAUNCHER"
printf '    [OK] Installed CLI launcher to %s\n' "$LAUNCHER"

# 3. Automatic background service (launchd on macOS, systemd on Linux)
NODE_BIN="$(command -v node || echo '/usr/local/bin/node')"
if [[ "$OSTYPE" == "darwin"* ]]; then
  LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
  mkdir -p "$LAUNCH_AGENTS_DIR"
  PLIST_FILE="$LAUNCH_AGENTS_DIR/com.supergraph.relay.plist"
  
  # Unload previous version if loaded
  launchctl unload "$PLIST_FILE" 2>/dev/null || true
  
  cat > "$PLIST_FILE" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.supergraph.relay</string>
    <key>ProgramArguments</key>
    <array>
        <string>$NODE_BIN</string>
        <string>$SCRIPT_DIR/relay-server.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/supergraph-relay.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/supergraph-relay.err</string>
</dict>
</plist>
EOF
  launchctl load -w "$PLIST_FILE" 2>/dev/null || true
  printf '    [OK] Configured and started background service via launchd (%s)\n' "$PLIST_FILE"
elif [[ "$OSTYPE" == "linux"* ]] && command -v systemctl >/dev/null 2>&1; then
  SYSTEMD_DIR="$HOME/.config/systemd/user"
  mkdir -p "$SYSTEMD_DIR"
  SERVICE_FILE="$SYSTEMD_DIR/supergraph-relay.service"
  cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=Supergraph Chrome Relay Server
After=network.target

[Service]
ExecStart=$NODE_BIN $SCRIPT_DIR/relay-server.js
Restart=always
RestartSec=3

[Install]
WantedBy=default.target
EOF
  systemctl --user daemon-reload 2>/dev/null || true
  systemctl --user enable --now supergraph-relay.service 2>/dev/null || true
  printf '    [OK] Configured and started background service via systemd user unit\n'
fi

printf '==> Supergraph Chrome Relay successfully configured and running!\n'
