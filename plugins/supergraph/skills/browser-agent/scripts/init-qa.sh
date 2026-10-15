#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
TEMPLATES_DIR="$SCRIPT_DIR/../templates"
QA_DIR="docs/qa"
EVIDENCE_DIR="$QA_DIR/evidence"

usage() {
  cat <<'EOF'
Usage:
  bash init-qa.sh matrix <feature-name> [target-url]
  bash init-qa.sh bug <feature-name> <defect-id> <defect-title>

Examples:
  bash init-qa.sh matrix checkout http://localhost:3000/checkout
  bash init-qa.sh bug checkout BUG-CHK-001 "Submit button unhandled 500"
EOF
  exit 1
}

CMD="${1:-}"
if [ -z "$CMD" ]; then
  usage
fi

mkdir -p "$QA_DIR" "$EVIDENCE_DIR"
CURRENT_DATE=$(date "+%Y-%m-%d %H:%M:%S")

case "$CMD" in
  matrix)
    FEATURE="${2:-}"
    TARGET_URL="${3:-http://localhost:3000}"
    if [ -z "$FEATURE" ]; then
      echo "Error: feature-name is required." >&2
      usage
    fi

    PREFIX=$(printf '%s' "$FEATURE" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
    OUTPUT_FILE="$QA_DIR/test-matrix-$FEATURE.md"

    if [ -f "$OUTPUT_FILE" ]; then
      echo "Warning: $OUTPUT_FILE already exists." >&2
      exit 0
    fi

    sed -e "s|{{FEATURE_NAME}}|$FEATURE|g" \
        -e "s|{{DATE}}|$CURRENT_DATE|g" \
        -e "s|{{TARGET_URL}}|$TARGET_URL|g" \
        -e "s|{{PREFIX}}|$PREFIX|g" \
        -e "s|{{PRECONDITIONS}}|Standard user session|g" \
        -e "s|{{TOTAL_TC}}|7|g" \
        "$TEMPLATES_DIR/test-matrix-template.md" > "$OUTPUT_FILE"

    echo "✅ Created QA Test Matrix: $OUTPUT_FILE"
    echo "📁 Evidence directory ready: $EVIDENCE_DIR"
    ;;

  bug)
    FEATURE="${2:-}"
    DEFECT_ID="${3:-}"
    DEFECT_TITLE="${4:-}"

    if [ -z "$FEATURE" ] || [ -z "$DEFECT_ID" ] || [ -z "$DEFECT_TITLE" ]; then
      echo "Error: feature-name, defect-id, and defect-title are required." >&2
      usage
    fi

    SAFE_ID=$(printf '%s' "$DEFECT_ID" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-')
    TIMESTAMP=$(date "+%Y%m%d-%H%M%S")
    OUTPUT_FILE="$QA_DIR/bug-report-$SAFE_ID-$TIMESTAMP.md"

    sed -e "s|{{DEFECT_ID}}|$DEFECT_ID|g" \
        -e "s|{{DEFECT_TITLE}}|$DEFECT_TITLE|g" \
        -e "s|{{FEATURE_NAME}}|$FEATURE|g" \
        -e "s|{{DATE}}|$CURRENT_DATE|g" \
        -e "s|{{SEVERITY}}|Major|g" \
        -e "s|{{PRIORITY}}|P1|g" \
        -e "s|{{TARGET_URL}}|http://localhost:3000|g" \
        -e "s|{{VIEWPORT}}|1280x800|g" \
        -e "s|{{PRECONDITION_1}}|Application running and reachable|g" \
        -e "s|{{PRECONDITION_2}}|Clean session storage|g" \
        -e "s|{{REF_INPUT}}|e2|g" \
        -e "s|{{TEST_INPUT}}|test_data|g" \
        -e "s|{{REF_SUBMIT}}|e5|g" \
        -e "s|{{EXPECTED_RESULT}}|Expected valid behavior|g" \
        -e "s|{{ACTUAL_RESULT}}|Encountered error behavior|g" \
        -e "s|{{CONSOLE_OUTPUT}}|(paste from agent-browser console)|g" \
        -e "s|{{ERRORS_OUTPUT}}|(paste from agent-browser errors)|g" \
        -e "s|{{NETWORK_OUTPUT}}|(paste from agent-browser network requests)|g" \
        -e "s|{{EVIDENCE_FILENAME}}|$SAFE_ID.png|g" \
        "$TEMPLATES_DIR/bug-report-template.md" > "$OUTPUT_FILE"

    echo "✅ Created Defect Report: $OUTPUT_FILE"
    ;;

  *)
    usage
    ;;
esac
