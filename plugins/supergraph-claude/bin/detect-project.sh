#!/usr/bin/env bash
# detect-project.sh — Detect project type, test/lint/format/build commands
# Usage: bash bin/detect-project.sh [directory]
# Output: PROJECT_TYPE, TEST_CMD, LINT_CMD, FORMAT_CMD, BUILD_CMD, PACKAGE_MANAGER, BRANCH

set -euo pipefail

DIR="${1:-.}"
cd "$DIR"

PROJECT_TYPE="unknown"
TEST_CMD=""
LINT_CMD=""
FORMAT_CMD=""
BUILD_CMD=""
PACKAGE_MANAGER="npm"

# ── Flutter / Dart ──
if [ -f "pubspec.yaml" ]; then
    PROJECT_TYPE="flutter"
    TEST_CMD="flutter test"
    LINT_CMD="flutter analyze"
    FORMAT_CMD="dart format ."
    BUILD_CMD="flutter build"

# ── Python ──
elif [ -f "pyproject.toml" ] || [ -f "setup.py" ] || [ -f "requirements.txt" ]; then
    PROJECT_TYPE="python"
    if [ -f "pyproject.toml" ] && grep -q "pytest" pyproject.toml 2>/dev/null; then
        TEST_CMD="pytest"
    else
        TEST_CMD="python -m pytest"
    fi
    if [ -f "pyproject.toml" ] && grep -q "ruff" pyproject.toml 2>/dev/null; then
        LINT_CMD="ruff check ."
        FORMAT_CMD="ruff format ."
    elif [ -f ".flake8" ]; then
        LINT_CMD="flake8 ."
        FORMAT_CMD="black ."
    else
        LINT_CMD="ruff check ."
        FORMAT_CMD="ruff format ."
    fi

# ── Go ──
elif [ -f "go.mod" ]; then
    PROJECT_TYPE="go"
    TEST_CMD="go test ./..."
    LINT_CMD="golangci-lint run"
    FORMAT_CMD="gofmt -w ."
    BUILD_CMD="go build ./..."

# ── Rust ──
elif [ -f "Cargo.toml" ]; then
    PROJECT_TYPE="rust"
    TEST_CMD="cargo test"
    LINT_CMD="cargo clippy -- -D warnings"
    FORMAT_CMD="cargo fmt"
    BUILD_CMD="cargo build"

# ── Java Gradle ──
elif [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]; then
    PROJECT_TYPE="java-gradle"
    GRADLE="./gradlew"
    [ -f "gradlew" ] || GRADLE="gradle"
    TEST_CMD="$GRADLE test"
    BUILD_CMD="$GRADLE build"

# ── Java Maven ──
elif [ -f "pom.xml" ]; then
    PROJECT_TYPE="java-maven"
    TEST_CMD="mvn test"
    BUILD_CMD="mvn package"

# ── Node.js ──
elif [ -f "package.json" ]; then
    PROJECT_TYPE="nodejs"
    if [ -f "bun.lockb" ] || [ -f "bun.lock" ]; then PACKAGE_MANAGER="bun"
    elif [ -f "pnpm-lock.yaml" ]; then PACKAGE_MANAGER="pnpm"
    elif [ -f "yarn.lock" ]; then PACKAGE_MANAGER="yarn"
    fi
    if grep -q '"vitest"' package.json 2>/dev/null; then TEST_CMD="npx vitest run"
    elif grep -q '"jest"' package.json 2>/dev/null; then TEST_CMD="npx jest"
    elif grep -q '"mocha"' package.json 2>/dev/null; then TEST_CMD="npx mocha"
    else TEST_CMD="$PACKAGE_MANAGER test"
    fi
    if [ -f "eslint.config.js" ] || [ -f "eslint.config.mjs" ] || \
       [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ]; then
        LINT_CMD="npx eslint ."
    elif grep -q '"lint"' package.json 2>/dev/null; then
        LINT_CMD="$PACKAGE_MANAGER run lint"
    fi
    if [ -f ".prettierrc" ] || [ -f "prettier.config.js" ]; then
        FORMAT_CMD="npx prettier --write ."
    fi
    if grep -q '"build"' package.json 2>/dev/null; then
        BUILD_CMD="$PACKAGE_MANAGER run build"
    fi

# ── PHP ──
elif [ -f "composer.json" ]; then
    PROJECT_TYPE="php"
    if grep -q 'pestphp/pest' composer.json 2>/dev/null; then TEST_CMD="vendor/bin/pest"
    else TEST_CMD="vendor/bin/phpunit"
    fi
    if [ -f "phpstan.neon" ] || [ -f "phpstan.neon.dist" ]; then LINT_CMD="vendor/bin/phpstan analyse"
    fi
fi

# ── Git branch ──
BRANCH=""
if command -v git &>/dev/null && git rev-parse --is-inside-work-tree &>/dev/null; then
    BRANCH=$(git branch --show-current 2>/dev/null || echo "")
fi

echo "PROJECT_TYPE=$PROJECT_TYPE"
echo "TEST_CMD=$TEST_CMD"
echo "LINT_CMD=$LINT_CMD"
echo "FORMAT_CMD=$FORMAT_CMD"
echo "BUILD_CMD=$BUILD_CMD"
echo "PACKAGE_MANAGER=$PACKAGE_MANAGER"
echo "BRANCH=$BRANCH"
