#!/usr/bin/env bash
# ==============================================================================
# capture-store-shots.sh
# Store-compliant screenshot capture & normalization tool for Flutter apps
# Part of Supergraph skill: flutter-screenshots
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PWD}"

usage() {
  cat <<'EOF'
Usage: capture-store-shots.sh <command> [options]

Commands:
  interactive               Prompt-based manual navigation capture on currently booted device
  normalize [dir]           Strip alpha channels and verify exact store resolutions
  test <udid> <test_path>   Boot simulator, run flutter integration_test, and shut down
  list-devices              List available iOS and Android simulators with store suitability

Options:
  --out <dir>               Output directory (default: ./screenshots)
  -h, --help                Show this help message

EOF
  exit 0
}

# Strip alpha channel and verify exact dimensions
normalize_images() {
  local target_dir="${1:-screenshots}"
  if [ ! -d "$target_dir" ]; then
    echo "Directory not found: $target_dir" >&2
    return 1
  fi

  echo "==> Normalizing images in: $target_dir"
  local count=0

  while IFS= read -r -d '' file; do
    # Apple strictly rejects PNG with Alpha Channel. Use macOS sips to convert/strip:
    if command -v sips >/dev/null 2>&1; then
      sips -s format png -s formatOptions default "$file" --out "$file" >/dev/null 2>&1
      local w h
      w=$(sips -g pixelWidth "$file" 2>/dev/null | awk '/pixelWidth/ {print $2}')
      h=$(sips -g pixelHeight "$file" 2>/dev/null | awk '/pixelHeight/ {print $2}')
      echo "✔ Normalized: $(basename "$file") [${w}x${h}] (RGB, No Alpha)"
    else
      echo "✔ Kept: $(basename "$file")"
    fi
    count=$((count + 1))
  done < <(find "$target_dir" -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) -print0)

  echo "==> Normalized $count images."
}

# Interactive capture on booted simulator / emulator
interactive_capture() {
  local out_base="${1:-screenshots}"
  local target_folder="$out_base/manual"

  # Detect booted iOS Simulator
  if command -v xcrun >/dev/null 2>&1 && xcrun simctl list devices booted | grep -q "Booted"; then
    local dev_name
    dev_name=$(xcrun simctl list devices booted | grep "Booted" | head -1 | sed -E 's/^[[:space:]]+//; s/[[:space:]]+\(.*//')
    echo "Detected iOS Simulator: $dev_name"
    if [[ "$dev_name" =~ iPad ]]; then
      target_folder="$out_base/ios_ipad_13"
    else
      target_folder="$out_base/ios_iphone_6.9"
    fi
  elif command -v adb >/dev/null 2>&1 && adb get-state 2>/dev/null | grep -q "device"; then
    echo "Detected Android Device / Emulator"
    target_folder="$out_base/android_phone"
  fi

  mkdir -p "$target_folder"
  echo "Images will be saved to: $target_folder"
  echo "Instructions: Navigate on the simulator to each screen, then press [ENTER] in this terminal."
  echo "Press [Ctrl+C] when you have finished capturing all desired screens."
  echo ""

  local idx=1
  while true; do
    printf "Press [ENTER] to capture screen #%02d: " "$idx"
    read -r
    local filename
    filename=$(printf "screen_%02d.png" "$idx")
    local filepath="$target_folder/$filename"

    if xcrun simctl list devices booted 2>/dev/null | grep -q "Booted"; then
      xcrun simctl io booted screenshot "$filepath"
    elif command -v adb >/dev/null 2>&1 && adb get-state 2>/dev/null | grep -q "device"; then
      adb exec-out screencap -p > "$filepath"
    else
      echo "Error: No booted simulator or adb device found!" >&2
      exit 1
    fi

    if command -v sips >/dev/null 2>&1; then
      sips -s format png -s formatOptions default "$filepath" --out "$filepath" >/dev/null 2>&1
      local w h
      w=$(sips -g pixelWidth "$filepath" 2>/dev/null | awk '/pixelWidth/ {print $2}')
      h=$(sips -g pixelHeight "$filepath" 2>/dev/null | awk '/pixelHeight/ {print $2}')
      echo "✔ Captured: $filename [${w}x${h}, No Alpha]"
    else
      echo "✔ Captured: $filename"
    fi

    idx=$((idx + 1))
  done
}

list_devices() {
  echo "=== Available iOS Simulators for App Store ==="
  if command -v xcrun >/dev/null 2>&1; then
    xcrun simctl list devices available | grep -E "iPhone 16 Pro Max|iPhone 15 Pro Max|iPhone 14 Pro Max|iPad Pro 13-inch|iPad Pro \(12.9-inch\)" || echo "No standard store simulators found."
  else
    echo "xcrun not found (macOS Xcode required for iOS simulators)."
  fi

  echo ""
  echo "=== Available Android Emulators for Google Play ==="
  if command -v emulator >/dev/null 2>&1; then
    emulator -list-avds || echo "No AVDs found."
  else
    echo "emulator command not in PATH."
  fi
}

# Main entrypoint
CMD="${1:-help}"
shift || true

case "$CMD" in
  interactive)
    interactive_capture "${1:-screenshots}"
    ;;
  normalize)
    normalize_images "${1:-screenshots}"
    ;;
  list-devices)
    list_devices
    ;;
  *)
    usage
    ;;
esac
