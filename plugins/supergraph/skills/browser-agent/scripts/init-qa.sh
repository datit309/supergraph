#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
TEMPLATES_DIR="$SCRIPT_DIR/../templates"
QA_DIR="docs/qa"
EVIDENCE_DIR="$QA_DIR/evidence"

usage() {
  cat <<'EOF'
Usage:
  bash init-qa.sh matrix <feature-name> [ui|api|fullstack] [target-url-or-endpoint]
  bash init-qa.sh bug <feature-name> <defect-id> <defect-title> [ui|api|fullstack]

Examples:
  bash init-qa.sh matrix auth ui http://localhost:3000/login
  bash init-qa.sh matrix auth api http://localhost:8000/api/v1/auth/login
  bash init-qa.sh matrix checkout fullstack http://localhost:3000/checkout
  bash init-qa.sh bug auth BUG-AUTH-001 "Missing password validation triggers unhandled 500" api
EOF
  exit 1
}

detect_dev_server() {
  local default_port="${1:-3000}"
  local candidate_ports=(3000 5173 8080 8000 4200 3001 5000 8081)
  
  # First check default port
  if curl -s -m 1 "http://127.0.0.1:$default_port" >/dev/null 2>&1; then
    echo "http://localhost:$default_port"
    return 0
  fi

  # Probe common frontend dev ports
  for port in "${candidate_ports[@]}"; do
    if curl -s -m 1 "http://127.0.0.1:$port" >/dev/null 2>&1; then
      echo "http://localhost:$port"
      return 0
    fi
  done

  echo "http://localhost:$default_port"
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
    TYPE="${3:-ui}"
    TARGET_INPUT="${4:-}"

    if [ -z "$FEATURE" ]; then
      echo "Error: feature-name is required." >&2
      usage
    fi

    if [ -n "$TARGET_INPUT" ]; then
      TARGET_URL="$TARGET_INPUT"
    else
      TARGET_URL=$(detect_dev_server 3000)
      echo "🔍 Auto-detected target server: $TARGET_URL"
    fi

    PREFIX=$(printf '%s' "$FEATURE" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
    OUTPUT_FILE="$QA_DIR/test-matrix-$FEATURE.md"
    SESSION_ID="${AGENT_BROWSER_SESSION:-sg-qa-$FEATURE-$(date +%s)}"

    if [ -f "$OUTPUT_FILE" ]; then
      echo "Warning: $OUTPUT_FILE already exists." >&2
      exit 0
    fi

    TEMPLATE_FILE="$TEMPLATES_DIR/test-matrix-template.md"
    TOTAL_TC="9"

    case "$TYPE" in
      api)
        TEMPLATE_FILE="$TEMPLATES_DIR/test-matrix-api-template.md"
        TOTAL_TC="8"
        ;;
      fullstack)
        TEMPLATE_FILE="$TEMPLATES_DIR/test-matrix-fullstack-template.md"
        TOTAL_TC="10"
        ;;
      ui|*)
        TEMPLATE_FILE="$TEMPLATES_DIR/test-matrix-template.md"
        TOTAL_TC="9"
        ;;
    esac

    sed -e "s|{{FEATURE_NAME}}|$FEATURE|g" \
        -e "s|{{DATE}}|$CURRENT_DATE|g" \
        -e "s|{{TARGET_URL}}|$TARGET_URL|g" \
        -e "s|{{API_ENDPOINT}}|$TARGET_URL|g" \
        -e "s|{{AGENT_BROWSER_SESSION}}|$SESSION_ID|g" \
        -e "s|{{PREFIX}}|$PREFIX|g" \
        -e "s|{{PRECONDITIONS}}|Standard user session / Bearer token|g" \
        -e "s|{{TOTAL_TC}}|$TOTAL_TC|g" \
        "$TEMPLATE_FILE" > "$OUTPUT_FILE"

    echo "✅ Created QA Test Matrix ($TYPE): $OUTPUT_FILE"
    echo "🔑 Isolated Session ID: $SESSION_ID"
    echo "📁 Evidence directory ready: $EVIDENCE_DIR"
    ;;

  bug)
    FEATURE="${2:-}"
    DEFECT_ID="${3:-}"
    DEFECT_TITLE="${4:-}"
    DEFECT_SCOPE="${5:-UI}"

    if [ -z "$FEATURE" ] || [ -z "$DEFECT_ID" ] || [ -z "$DEFECT_TITLE" ]; then
      echo "Error: feature-name, defect-id, and defect-title are required." >&2
      usage
    fi

    TARGET_URL=$(detect_dev_server 3000)
    SAFE_ID=$(printf '%s' "$DEFECT_ID" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-')
    TIMESTAMP=$(date "+%Y%m%d-%H%M%S")
    OUTPUT_FILE="$QA_DIR/bug-report-$SAFE_ID-$TIMESTAMP.md"
    SESSION_ID="${AGENT_BROWSER_SESSION:-sg-qa-$FEATURE-$(date +%s)}"

    sed -e "s|{{DEFECT_ID}}|$DEFECT_ID|g" \
        -e "s|{{DEFECT_TITLE}}|$DEFECT_TITLE|g" \
        -e "s|{{DEFECT_SCOPE}}|$DEFECT_SCOPE|g" \
        -e "s|{{FEATURE_NAME}}|$FEATURE|g" \
        -e "s|{{DATE}}|$CURRENT_DATE|g" \
        -e "s|{{SEVERITY}}|Major|g" \
        -e "s|{{PRIORITY}}|P1|g" \
        -e "s|{{TARGET_URL}}|$TARGET_URL|g" \
        -e "s|{{AGENT_BROWSER_SESSION}}|$SESSION_ID|g" \
        -e "s|{{PRECONDITION_1}}|Application / API service running and reachable|g" \
        -e "s|{{PRECONDITION_2}}|Clean session storage / fresh test database state|g" \
        -e "s|{{REF_INPUT}}|e2|g" \
        -e "s|{{TEST_INPUT}}|{\"test_field\": \"data\"}|g" \
        -e "s|{{REF_SUBMIT}}|e5|g" \
        -e "s|{{EXPECTED_RESULT}}|Expected valid behavior or 200 OK|g" \
        -e "s|{{ACTUAL_RESULT}}|Encountered error behavior or 500 Internal Server Error|g" \
        -e "s|{{ACTUAL_STATUS_CODE}}|500|g" \
        -e "s|{{EXPECTED_STATUS_CODE}}|200/201|g" \
        -e "s|{{RESPONSE_BODY}}|{\"error\": \"Internal Server Error\"}|g" \
        -e "s|{{CONSOLE_OUTPUT}}|(paste from agent-browser console)|g" \
        -e "s|{{ERRORS_OUTPUT}}|(paste from agent-browser errors)|g" \
        -e "s|{{VITALS_OUTPUT}}|(paste from agent-browser vitals --json)|g" \
        -e "s|{{A11Y_OUTPUT}}|(paste from agent-browser a11y --json)|g" \
        -e "s|{{SERVER_LOG}}|(paste from server application log)|g" \
        -e "s|{{EVIDENCE_FILENAME}}|$SAFE_ID.png|g" \
        "$TEMPLATES_DIR/bug-report-template.md" > "$OUTPUT_FILE"

    echo "✅ Created Defect Report ($DEFECT_SCOPE): $OUTPUT_FILE"
    echo "🔑 Isolated Session ID: $SESSION_ID"
    ;;

  *)
    usage
    ;;
esac
