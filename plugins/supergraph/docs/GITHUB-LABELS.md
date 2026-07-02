# GitHub Labels

Standardized label system for issue and PR triage. Labels are grouped by category with consistent color coding.

## Color Grouping

| Category | Color Range | Purpose |
|----------|-------------|---------|
| **Type** | Varied per type | Classify what kind of work an issue represents |
| **Priority** | Red-Yellow gradient | Signal urgency (P0 = critical, P2 = low) |
| **Size** | Pastel gradient | Estimate effort for sprint planning |
| **Triage** | Pink-Purple | Track issues needing attention |
| **Workflow** | Green-Red | Track issue lifecycle state |

## Labels

### Type Labels (13)

| Name | Color | Hex | Description |
|------|-------|-----|-------------|
| `good first issue` | Purple | `#7057ff` | Good for newcomers to the project |
| `skill` | Green | `#0e8a16` | New or improved skill contribution |
| `agent` | Blue | `#1d76db` | New or improved agent contribution |
| `hook` | Dark Purple | `#5319e7` | New or improved hook contribution |
| `translation` | Green | `#0e8a16` | Translation or internationalization work |
| `bug` | Red | `#d73a4a` | Something is not working correctly |
| `enhancement` | Cyan | `#a2eeef` | New feature or improvement request |
| `docs` | Blue | `#0075ca` | Documentation improvements |
| `protocol` | Green | `#0e8a16` | RIPER-5 protocol or development process changes |
| `community` | Light Blue | `#c5def5` | Community-related discussions or improvements |
| `help wanted` | Teal | `#008672` | Extra attention is needed |
| `duplicate` | Light Gray | `#cfd3d7` | This issue or PR already exists |
| `wontfix` | White | `#ffffff` | This will not be worked on |

### Priority Labels (3)

| Name | Color | Hex | Description |
|------|-------|-----|-------------|
| `priority:P0` | Dark Red | `#b60205` | Critical -- must fix immediately |
| `priority:P1` | Orange Red | `#d93f0b` | High -- fix within current cycle |
| `priority:P2` | Yellow | `#fbca04` | Low -- fix when convenient |

### Size Labels (4)

| Name | Color | Hex | Description |
|------|-------|-----|-------------|
| `size:S` | Light Green | `#c2e0c6` | Small -- less than 2 hours |
| `size:M` | Light Blue | `#bfd4f2` | Medium -- 2-6 hours |
| `size:L` | Light Purple | `#d4c5f9` | Large -- 6-16 hours |
| `size:XL` | Light Orange | `#f9d0c4` | Extra Large -- more than 16 hours |

### Triage Labels (2)

| Name | Color | Hex | Description |
|------|-------|-----|-------------|
| `needs-triage` | Pink | `#e99695` | Issue has not been reviewed yet |
| `needs-info` | Purple | `#d876e3` | More information needed from reporter |

### Workflow Labels (2)

| Name | Color | Hex | Description |
|------|-------|-----|-------------|
| `in-progress` | Green | `#0e8a16` | Actively being worked on |
| `blocked` | Dark Red | `#b60205` | Blocked by another issue or external dependency |

## CLI Setup Commands

Run these commands to create all labels in your GitHub repository:

```bash
# Type Labels
gh label create "good first issue" --color "7057ff" --description "Good for newcomers to the project" --force
gh label create "skill" --color "0e8a16" --description "New or improved skill contribution" --force
gh label create "agent" --color "1d76db" --description "New or improved agent contribution" --force
gh label create "hook" --color "5319e7" --description "New or improved hook contribution" --force
gh label create "translation" --color "0e8a16" --description "Translation or internationalization work" --force
gh label create "bug" --color "d73a4a" --description "Something is not working correctly" --force
gh label create "enhancement" --color "a2eeef" --description "New feature or improvement request" --force
gh label create "docs" --color "0075ca" --description "Documentation improvements" --force
gh label create "protocol" --color "0e8a16" --description "RIPER-5 protocol or development process changes" --force
gh label create "community" --color "c5def5" --description "Community-related discussions or improvements" --force
gh label create "help wanted" --color "008672" --description "Extra attention is needed" --force
gh label create "duplicate" --color "cfd3d7" --description "This issue or PR already exists" --force
gh label create "wontfix" --color "ffffff" --description "This will not be worked on" --force

# Priority Labels
gh label create "priority:P0" --color "b60205" --description "Critical -- must fix immediately" --force
gh label create "priority:P1" --color "d93f0b" --description "High -- fix within current cycle" --force
gh label create "priority:P2" --color "fbca04" --description "Low -- fix when convenient" --force

# Size Labels
gh label create "size:S" --color "c2e0c6" --description "Small -- less than 2 hours" --force
gh label create "size:M" --color "bfd4f2" --description "Medium -- 2-6 hours" --force
gh label create "size:L" --color "d4c5f9" --description "Large -- 6-16 hours" --force
gh label create "size:XL" --color "f9d0c4" --description "Extra Large -- more than 16 hours" --force

# Triage Labels
gh label create "needs-triage" --color "e99695" --description "Issue has not been reviewed yet" --force
gh label create "needs-info" --color "d876e3" --description "More information needed from reporter" --force

# Workflow Labels
gh label create "in-progress" --color "0e8a16" --description "Actively being worked on" --force
gh label create "blocked" --color "b60205" --description "Blocked by another issue or external dependency" --force
```
