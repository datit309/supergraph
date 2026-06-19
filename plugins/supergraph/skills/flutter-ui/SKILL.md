---
name: flutter-ui
description: Build Flutter UI from Figma MCP or image input. Scans src for design tokens (colors, sizes, text styles), existing components, and naming conventions before writing a single line of code. Never hard-codes values.
---

# /supergraph:flutter-ui

Build pixel-faithful Flutter UI grounded in the project's own design system.

Announce: "🎨 /supergraph:flutter-ui — scanning project design system..."

## Input modes

- **Figma MCP** — user provides a Figma URL or node ID
- **Image** — user provides a screenshot or design image

Both modes follow the same pipeline.

### Figma URL parsing

Extract `fileKey` and `nodeId` from the URL before calling any Figma tool:

```
https://www.figma.com/design/<fileKey>/Title?node-id=<raw-nodeId>
```

- `fileKey` — alphanumeric segment after `/design/` or `/file/`
- `nodeId` — value of `node-id` query param; replace `-` with `:` (e.g. `123-456` → `123:456`)

If the user provides only a `nodeId` string without a URL, use it as-is.

---

## Step 1 — Scan project design system

Before reading any Figma or image data, scan src to understand what already exists.

### 1a. Locate token files

Search for files likely to hold design tokens. Common patterns:

```
find . -type f -name "*.dart" | xargs grep -l "Color\|Colors\." | grep -iE "color|theme|token|palette|constant|style|dimen|size|spacing|radius" | head -20
find . -type f -name "*.dart" | xargs grep -l "TextStyle\|fontSize\|FontWeight" | grep -iE "text|typo|font|style|theme" | head -20
find . -type f -name "*.dart" | xargs grep -l "EdgeInsets\|Radius\|double" | grep -iE "dimen|size|spacing|padding|radius|constant" | head -20
find . \( -name "theme" -o -name "themes" \) -type d | head -10
```

### 1b. Extract token registry

Read the identified files and build a registry. Replace `<token_file>`, `<style_file>`, `<dimen_file>`, `<theme_file>` with the actual file paths found in Step 1a:

**Colors:**

```
grep -n "static.*Color\|Color(" <token_file> | head -40
```

Extract: constant name → hex/Color value. Example:

```
AppColors.primary       → Color(0xFF6C63FF)
AppColors.background    → Color(0xFFF5F5F5)
```

**Text styles:**

```
grep -n "TextStyle\|fontSize\|FontWeight\|fontFamily" <style_file> | head -40
```

Extract: style name → fontSize + fontWeight + color. Example:

```
AppTextStyles.heading1  → 24sp, FontWeight.w700, AppColors.textPrimary
AppTextStyles.body      → 14sp, FontWeight.w400, AppColors.textSecondary
```

**Spacing / sizing:**

```
grep -n "static.*double\|const.*= [0-9]" <dimen_file> | head -40
```

Extract: constant name → value. Example:

```
AppSizes.paddingM  → 16.0
AppSizes.radiusS   → 8.0
```

**Theme setup:**

```
grep -n "ThemeData\|colorScheme\|MaterialApp" <theme_file> | head -20
```

Determine token access pattern — this governs all generated code:

- **Direct class** (e.g. `AppColors.primary`, `AppTextStyles.body`) → use class references in Step 5
- **ThemeData/ColorScheme** (e.g. `Theme.of(context).colorScheme.primary`) → use `Theme.of(context)` in Step 5; map token names to `ColorScheme` / `TextTheme` properties instead of static class fields

If mixed (both patterns exist), note which is dominant and match that.

### 1c. Find existing reusable widgets

```
find . -path "*/widgets/*.dart" -o -path "*/components/*.dart" -o -path "*/common/*.dart" | head -30
```

For each file, extract the widget class name and constructor signature using grep (avoids line-count truncation):

```bash
grep -n "class \|const \|required \|this\." <widget_file> | head -20
```

Read until the constructor closing `)` is found. List as:

```
AppButton(label, onPressed, [variant])    → lib/widgets/app_button.dart
AppCard(child, [padding, elevation])      → lib/widgets/app_card.dart
```

If no widget files found in any of the search paths: skip reuse — generate all UI sections as new private classes.

### 1d. Detect state management

```bash
grep -rn "import.*bloc\|import.*riverpod\|import.*provider\|import.*get_it\|import.*getx\|import.*mobx\|import.*signals" lib/ pubspec.yaml | head -10
```

Note the detected pattern (BLoC / Riverpod / Provider / GetX / none). Generated code must match this pattern exactly.

### 1e. Detect naming & import convention

Pick the first `.dart` file found under common screen directories as the reference file:

```bash
find . \( -path "*/lib/screens/*.dart" -o -path "*/lib/pages/*.dart" -o -path "*/lib/features/*.dart" -o -path "*/lib/views/*.dart" -o -path "*/lib/ui/*.dart" -o -path "*/lib/presentation/*.dart" \) | head -1
```

If none found, widen to any dart file in lib/:

```bash
find lib/ -name "*.dart" | head -1
```

Then extract import style:

```bash
grep -n "import.*lib/" <reference_file> | head -10
```

Note: barrel exports (`index.dart`), path aliases, part files. This determines how to write imports in generated code. If still no file found, default to direct path imports (`import 'package:<app>/...`').

---

## Step 2 — Extract design from Figma or image

### If Figma MCP:

```
mcp__Figma__get_figma_data(fileKey=<key>, nodeId=<nodeId>)
```

From the response, extract:

- **Layout**: width, height, padding, gap, axis direction (row/column), alignment
- **Colors**: all fill/stroke hex values → map to registry tokens (Step 1b)
- **Text**: content, fontSize, fontWeight, fontFamily → map to registry text styles
- **Corners**: borderRadius values → map to registry sizing constants
- **Spacing**: padding, margin, gap values → map to registry spacing constants
- **Variants / interactive states**: if the node has variants (e.g. Normal / Hover / Disabled / Active), note each variant name. Map to a boolean or enum param on the generated widget (e.g. `isDisabled`, `isActive`, `isSelected`). Do not generate separate widgets per variant — use a single widget with conditional styling.

- **Images/icons**: for each icon/image node, classify:
  - Matches a Material icon name → use `Icon(Icons.xxx)`, no download needed
  - Custom SVG/PNG → note node ID for download

**If a Figma color has no match in the token registry:** note it, do NOT hard-code — STOP and ask user whether to add a new token or map to the nearest existing one. Resume only after user confirms.

Download custom assets if needed:

```
mcp__Figma__download_figma_images(fileKey=<key>, nodes=[{nodeId, fileName}], localPath=<assets/path>)
```

After download, check `pubspec.yaml` for the `flutter.assets:` section. If the downloaded path is not declared, add it — otherwise `Image.asset(...)` will fail at runtime.

### If image input:

Analyze the image visually:

- Break down the screen into sections (AppBar, body, cards, buttons, bottom nav, etc.)
- Estimate layout: flex direction, alignment, rough padding/gap
- Identify colors visually → match to nearest token in registry (Step 1b) by visual similarity
- Identify text hierarchy → map to nearest text style in registry
- Identify component shapes → match to existing widgets (Step 1c)
- Identify images/icons → classify as Material icon or custom asset (same as Figma mode)
- For any custom asset referenced: verify its directory is declared under `flutter.assets:` in `pubspec.yaml`

**If a color has no close match in registry:** note it, do NOT hard-code — ask user whether to add a new token or use the nearest existing one.

---

## Step 3 — Build token mapping table

Before writing any code, produce a mapping table:

| Design value                  | Token to use             | Source   |
| ----------------------------- | ------------------------ | -------- |
| `#6C63FF` (primary button bg) | `AppColors.primary`      | registry |
| `24px bold` heading           | `AppTextStyles.heading1` | registry |
| `16px` padding                | `AppSizes.paddingM`      | registry |
| `8px` corner radius           | `AppSizes.radiusS`       | registry |
| `#FFFFFF` background          | `AppColors.background`   | registry |

**Unmapped token gate:** After building the full table, check for any unmapped row. If found → STOP, present the partial table to user, ask for resolution per value, resume only after all rows are resolved. The per-value STOP in Step 2 is for early discovery during extraction; this gate is the final check before proceeding to Step 4. Do not proceed with any unmapped value.

---

## Step 4 — Plan widget tree

Decompose the design into a widget tree before coding:

```
Scaffold
  AppBar: AppBar(title: Text(..., style: AppTextStyles.heading1))
  body: SingleChildScrollView
    Column(padding: AppSizes.paddingM)
      _HeaderSection          ← new private widget
      SizedBox(h: AppSizes.gapL)
      AppCard(...)            ← existing widget
        _CardContent          ← new private widget
      SizedBox(h: AppSizes.gapM)
      AppButton(...)          ← existing widget
```

Rules:

- Reuse existing widgets (Step 1c) wherever shape/behavior matches
- Extract sections > 40 lines into private `_WidgetName` classes in same file
- No widget method extraction (`Widget _buildXxx()`) — use classes

---

## Step 5 — Generate code

Write the Flutter file(s) following these rules:

### Token usage (CRITICAL — no exceptions)

```dart
// ✅ correct
color: AppColors.primary
fontSize: AppTextStyles.body.fontSize
padding: EdgeInsets.all(AppSizes.paddingM)
borderRadius: BorderRadius.circular(AppSizes.radiusS)

// ❌ forbidden
color: Color(0xFF6C63FF)
fontSize: 14
padding: EdgeInsets.all(16)
borderRadius: BorderRadius.circular(8)
```

### Structure rules

- One file per screen/major component
- File name and location follow the convention detected in Step 1e — match the naming style (`login_screen.dart`, `login_page.dart`, `login_view.dart`) and directory (`lib/screens/`, `lib/pages/`, `lib/features/xxx/`) of existing screens
- Private widgets as classes at bottom of file, not methods
- Import via the convention detected in Step 1e (barrel or direct path)
- `const` constructors wherever possible
- No `print()`, no `TODO`, no placeholder lorem ipsum unless design specifies

### Assets

- Material icons → `Icon(Icons.xxx)` — no asset file needed
- Custom PNG → use `flutter_gen` generated class (e.g. `Assets.images.imgWelcome.image()`) — check how existing screens reference images to match the generated class naming
- Custom SVG → use `flutter_gen` generated class (e.g. `Assets.icons.icArrowRight.svg()`) — check how existing screens reference SVGs to match the generated class naming
- **Asset naming convention** (applied when downloading from Figma or referencing existing files):
  - Format: `snake_case`, all lowercase, no spaces, no hyphens
  - Prefix by type: `ic_` for icons, `img_` for images, `bg_` for backgrounds
  - Include state suffix where relevant: `ic_home.svg`, `ic_home_active.svg`, `ic_home_disabled.svg`
  - No generic names: `image1.png`, `icon.svg`, `asset.png` are forbidden
  - Example: `img_onboarding_welcome.png`, `ic_arrow_right.svg`, `bg_login.png`

- **`pubspec.yaml` asset declaration check:** before referencing any asset (downloaded from Figma or existing in project), verify its directory is declared under `flutter.assets:`. If not, add it before running `build_runner`.

- **If `flutter_gen` is not in `pubspec.yaml`:** propose setup before writing any asset reference:
  1. Add to `pubspec.yaml`:
     ```yaml
     dev_dependencies:
       build_runner:
       flutter_gen_runner:
     flutter_gen:
       output:
         package_parameter_enabled: false
     flutter:
       assets:
         - assets/images/
         - assets/icons/
     ```
  2. Run `flutter pub get && dart run build_runner build`
  3. After the generated `Assets` class exists, use it in all asset references — never fall back to `Image.asset(string)` or `SvgPicture.asset(string)`

### Responsive

- If design shows both mobile and tablet/desktop layouts → use `LayoutBuilder`
- Otherwise assume single form factor — do not add responsive boilerplate speculatively

### State

- Use the state management pattern detected in Step 1d — do NOT introduce a different one
- `const` constructors only for stateless leaf widgets; omit where widget depends on runtime state or reactive data

---

## Step 6 — Self-verify before handing off

Run these checks mentally (or with grep) before presenting code:

```bash
# Hard-coded hex colors or Color.from* constructors
grep -n "Color(0x\|Color\.from" <generated_file>

# Hard-coded Colors.* named colors (review hits — only Colors.transparent is acceptable)
grep -n "Colors\." <generated_file>

# Hard-coded spacing/size literals
grep -nE "EdgeInsets\.(all|symmetric|only|fromLTRB)\([^A-Z]|SizedBox\((height|width):\s*[0-9]|Container\((height|width):\s*[0-9]|fontSize:\s*[0-9]" <generated_file>

# No Widget method extraction
grep -n "Widget _build" <generated_file>

# Stray debug/placeholder
grep -n "print(\|TODO" <generated_file>
```

For color hits: `Color(0x*` and `Color.from*` → always fix. `Colors.*` → fix unless it is `Colors.transparent`.
For spacing hits → replace with registry token.
If any unfixable hit → note in output and ask user.

---

## Output format

Present in this order:

1. **Token mapping table** (Step 3) — so user can verify before seeing code
2. **Widget tree plan** (Step 4 summary) — one-paragraph description
3. **Generated code** — full file(s), ready to paste
4. **Assets to download** (if any Figma images) — list node IDs + target paths

---

## Hard rules

- NEVER hard-code a color, font size, spacing, or radius value
- NEVER introduce a new design token without explicit user approval (user may approve during unmapped-color pause in Step 2/3)
- NEVER use a state management pattern different from what src uses
- NEVER extract widget sections as methods — use private classes
- ALWAYS scan src before reading Figma/image
- ALWAYS produce the token mapping table before code
- If registry is empty (no tokens found): stop and ask user where design tokens are declared before proceeding
