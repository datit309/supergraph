#!/usr/bin/env bash
set -euo pipefail

# Helper to scaffold Mobile QA matrices, bug reports, and inspect iOS/Android device readiness
CMD="${1:-help}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
QA_DIR="docs/qa"

mkdir -p "$QA_DIR" "$QA_DIR/evidence" "screenshots"

case "$CMD" in
  matrix)
    FEATURE="${2:-core}"
    APP_ID="${3:-com.example.app}"
    PLATFORM="${4:-Cross-Platform}"
    OUT_FILE="$QA_DIR/mobile-matrix-$FEATURE.md"
    TPL="$SKILL_DIR/templates/test-matrix-mobile-template.md"

    if [[ -f "$OUT_FILE" ]]; then
      echo "Matrix already exists at $OUT_FILE"
    else
      sed -e "s/\[Feature Name\]/$FEATURE/g" \
          -e "s/\[com.example.bundleid \/ package\]/$APP_ID/g" \
          -e "s/\[iOS | Android | Cross-Platform\]/$PLATFORM/g" \
          -e "s/\[YYYY-MM-DD\]/$(date +%Y-%m-%d)/g" \
          "$TPL" > "$OUT_FILE"
      echo "✅ Created mobile test matrix: $OUT_FILE"
    fi
    ;;

  bug)
    FEATURE="${2:-general}"
    DEFECT_ID="${3:-MOB-BUG-001}"
    TITLE="${4:-Mobile UI defect}"
    PLATFORM="${5:-Mobile}"
    OUT_FILE="$QA_DIR/mobile-bug-$DEFECT_ID.md"
    TPL="$SKILL_DIR/templates/mobile-bug-report-template.md"

    sed -e "s/\[DEFECT-ID\]/$DEFECT_ID/g" \
        -e "s/\[Brief bug description\]/$TITLE/g" \
        -e "s/\[iOS | Android\]/$PLATFORM/g" \
        -e "s/\[YYYY-MM-DD HH:mm:ss\]/$(date '+%Y-%m-%d %H:%M:%S')/g" \
        "$TPL" > "$OUT_FILE"
    echo "✅ Created mobile defect report: $OUT_FILE"
    ;;

  doctor)
    echo "🔍 Checking Unified Mobile QA Environment (iOS & Android)..."
    STATUS=0

    echo ""
    echo "--- 🍏 iOS (WebDriverAgent) ---"
    # 1. Check curl connection to WDA
    if curl -s --connect-timeout 2 "http://127.0.0.1:8100/status" > /dev/null; then
      echo "  ✔ WDA Server is running on http://127.0.0.1:8100"
    else
      echo "  ℹ WDA Server not reachable on :8100 (Start WDA or run 'iproxy 8100 8100')"
    fi

    if command -v idevice_id &> /dev/null; then
      DEVICES=$(idevice_id -l 2>/dev/null || true)
      if [[ -n "$DEVICES" ]]; then
        echo "  ✔ Connected physical iOS device(s):"
        echo "$DEVICES" | sed 's/^/    - /'
      else
        echo "  ℹ No physical iOS devices currently connected via USB."
      fi
    fi

    if command -v xcrun &> /dev/null; then
      BOOTED_SIMS=$(xcrun simctl list devices booted -j 2>/dev/null || true)
      if echo "$BOOTED_SIMS" | grep -q "Booted"; then
        echo "  ✔ Found booted iOS Simulator(s)."
      fi
    fi

    echo ""
    echo "--- 🤖 Android (UiAutomator2) ---"
    # 2. Check curl connection to UiAutomator2 Server
    if curl -s --connect-timeout 2 "http://127.0.0.1:6790/status" > /dev/null; then
      echo "  ✔ UiAutomator2 Server is running on http://127.0.0.1:6790"
    else
      echo "  ℹ UiAutomator2 Server not reachable on :6790 ('adb forward tcp:6790 tcp:6790')"
    fi

    if command -v adb &> /dev/null; then
      echo "  ✔ adb CLI is installed ($(which adb))"
      AND_DEVICES=$(adb devices 2>/dev/null | grep -v "List of" | grep -v "^$" || true)
      if [[ -n "$AND_DEVICES" ]]; then
        echo "  ✔ Connected Android device(s):"
        echo "$AND_DEVICES" | sed 's/^/    - /'
      else
        echo "  ℹ No Android devices currently attached via ADB."
      fi
    fi

    echo ""
    exit "$STATUS"
    ;;

  *)
    echo "Usage:"
    echo "  $0 matrix <feature> [app_id] [platform]    Create mobile test matrix"
    echo "  $0 bug <feature> <defect_id> \"<title>\"     Create mobile defect report"
    echo "  $0 doctor                                 Inspect iOS & Android health"
    exit 1
    ;;
esac
