#!/usr/bin/env bash
# Detect project type and output test/lint commands
# Used by hooks and skills

DIR="${1:-.}"
cd "$DIR"

if [ -f "pubspec.yaml" ]; then
    echo "PROJECT_TYPE=flutter"
    echo "TEST_CMD=flutter test"
    echo "LINT_CMD=flutter analyze"
elif [ -f "package.json" ]; then
    echo "PROJECT_TYPE=nodejs"
    # Detect test runner
    if grep -q '"vitest"' package.json 2>/dev/null; then
        echo "TEST_CMD=npx vitest run"
    elif grep -q '"jest"' package.json 2>/dev/null; then
        echo "TEST_CMD=npx jest"
    elif grep -q '"mocha"' package.json 2>/dev/null; then
        echo "TEST_CMD=npx mocha"
    else
        echo "TEST_CMD=npm test"
    fi
    # Detect linter
    if [ -f "eslint.config.js" ] || [ -f "eslint.config.mjs" ] || \
       [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ]; then
        echo "LINT_CMD=npx eslint ."
    else
        echo "LINT_CMD=npm run lint"
    fi
elif [ -f "composer.json" ]; then
    echo "PROJECT_TYPE=php"
    if grep -q 'pestphp/pest' composer.json 2>/dev/null; then
        echo "TEST_CMD=vendor/bin/pest"
    else
        echo "TEST_CMD=vendor/bin/phpunit"
    fi
    if [ -f "phpstan.neon" ] || [ -f "phpstan.neon.dist" ]; then
        echo "LINT_CMD=vendor/bin/phpstan analyse"
    else
        echo "LINT_CMD=vendor/bin/phpcs"
    fi
else
    echo "PROJECT_TYPE=unknown"
    echo "TEST_CMD="
    echo "LINT_CMD="
fi
