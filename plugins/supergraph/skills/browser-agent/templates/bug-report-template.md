# Defect Report: [{{DEFECT_ID}}] {{DEFECT_TITLE}}

> Standard: ISTQB Incident Report | Severity: {{SEVERITY}} | Priority: {{PRIORITY}}
> Date: {{DATE}} | Reporter: Supergraph QA Automation

---

## 1. Defect Overview

- **Defect ID:** `{{DEFECT_ID}}`
- **Component / Feature:** `{{FEATURE_NAME}}`
- **Severity:** `{{SEVERITY}}` *(Blocker / Critical / Major / Minor)*
- **Priority:** `{{PRIORITY}}` *(P0 - Fix Immediately / P1 - High / P2 - Normal)*
- **Environment:**
  - Browser Engine: Chrome CDP (`agent-browser`)
  - Target URL: `{{TARGET_URL}}`
  - Viewport: `{{VIEWPORT}}`

---

## 2. Preconditions

1. {{PRECONDITION_1}}
2. {{PRECONDITION_2}}

---

## 3. Steps to Reproduce (Deterministic)

```bash
# Exact agent-browser commands to reproduce:
agent-browser open "{{TARGET_URL}}"
agent-browser snapshot -i
agent-browser fill @{{REF_INPUT}} "{{TEST_INPUT}}"
agent-browser click @{{REF_SUBMIT}}
```

---

## 4. Expected vs Actual Result

- **Expected Result:** {{EXPECTED_RESULT}}
- **Actual Result:** {{ACTUAL_RESULT}}

---

## 5. Diagnostics & Evidence

### Console Errors (`agent-browser console`)
```text
{{CONSOLE_OUTPUT}}
```

### Unhandled Runtime Errors (`agent-browser errors`)
```text
{{ERRORS_OUTPUT}}
```

### Failed Network Requests (`agent-browser network requests`)
```text
{{NETWORK_OUTPUT}}
```

### Screenshot Evidence
`docs/qa/evidence/{{EVIDENCE_FILENAME}}`
