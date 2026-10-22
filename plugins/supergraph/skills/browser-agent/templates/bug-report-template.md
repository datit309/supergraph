# Defect Report: [{{DEFECT_ID}}] {{DEFECT_TITLE}}

> Standard: ISTQB Incident Report | Scope: {{DEFECT_SCOPE}} | Severity: {{SEVERITY}} | Priority: {{PRIORITY}}
> Date: {{DATE}} | Reporter: Supergraph QA Automation

---

## 1. Defect Overview

- **Defect ID:** `{{DEFECT_ID}}`
- **Scope:** `{{DEFECT_SCOPE}}` *(UI / API / Full-Stack / Database)*
- **Component / Service:** `{{FEATURE_NAME}}`
- **Severity:** `{{SEVERITY}}` *(Blocker / Critical / Major / Minor)*
- **Priority:** `{{PRIORITY}}` *(P0 - Blocker / P1 - High / P2 - Medium)*
- **Target Route / Endpoint:** `{{TARGET_URL}}`
- **Session ID:** `{{AGENT_BROWSER_SESSION}}`

---

## 2. Preconditions & Environment

1. {{PRECONDITION_1}}
2. {{PRECONDITION_2}}
- Environment Details: OS, Runtime, Browser / HTTP Client, DB state.

---

## 3. Steps to Reproduce (Deterministic)

### UI Reproduction Steps (`agent-browser`)
```bash
# Optional: Start video recording for interactive/state reproduction
agent-browser --session "{{AGENT_BROWSER_SESSION}}" record start docs/qa/evidence/{{DEFECT_ID}}-repro.webm --cursor --contact-sheet

agent-browser --session "{{AGENT_BROWSER_SESSION}}" open "{{TARGET_URL}}"
agent-browser --session "{{AGENT_BROWSER_SESSION}}" snapshot -i
agent-browser --session "{{AGENT_BROWSER_SESSION}}" fill @{{REF_INPUT}} "{{TEST_INPUT}}"
agent-browser --session "{{AGENT_BROWSER_SESSION}}" click @{{REF_SUBMIT}}

# Stop video recording
agent-browser --session "{{AGENT_BROWSER_SESSION}}" record stop
```

### API Reproduction Steps (`curl` / HTTP)
```bash
curl -X POST "{{TARGET_URL}}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{{TEST_INPUT}}'
```

---

## 4. Expected vs Actual Result

- **Expected Result:** {{EXPECTED_RESULT}}
- **Actual Result:** {{ACTUAL_RESULT}}

---

## 5. Technical Diagnostics & Evidence

### Visual & Video Evidence
- **Interactive Video Reproduction:** `docs/qa/evidence/{{DEFECT_ID}}-repro.webm` *(with `--cursor --contact-sheet`)*
- **Static Annotated Screenshot:** `docs/qa/evidence/{{DEFECT_ID}}-annotated.png`

### HTTP / API Dump
- **Status Code:** `{{ACTUAL_STATUS_CODE}}` *(Expected: `{{EXPECTED_STATUS_CODE}}`)*
- **Response Headers / Body:**
```json
{{RESPONSE_BODY}}
```

### UI & Client Diagnostics (`agent-browser`)
- **Console Log (`agent-browser console`):**
```text
{{CONSOLE_OUTPUT}}
```
- **Runtime Errors (`agent-browser errors`):**
```text
{{ERRORS_OUTPUT}}
```
- **Web Vitals / Hydration (`agent-browser vitals`):**
```json
{{VITALS_OUTPUT}}
```
- **Accessibility Violations (`agent-browser a11y`):**
```json
{{A11Y_OUTPUT}}
```

### Server & Database State
- **Server Log / Stack Trace:**
```text
{{SERVER_LOG}}
```
- **Database Discrepancy:** *(e.g., Row inserted with null foreign key, transaction not rolled back)*
