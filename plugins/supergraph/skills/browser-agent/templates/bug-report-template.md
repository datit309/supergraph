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

---

## 2. Preconditions & Environment

1. {{PRECONDITION_1}}
2. {{PRECONDITION_2}}
- Environment Details: OS, Runtime, Browser / HTTP Client, DB state.

---

## 3. Steps to Reproduce (Deterministic)

### UI Reproduction Steps (`agent-browser`)
```bash
agent-browser open "{{TARGET_URL}}"
agent-browser snapshot -i
agent-browser fill @{{REF_INPUT}} "{{TEST_INPUT}}"
agent-browser click @{{REF_SUBMIT}}
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
- **Screenshot Link:** `docs/qa/evidence/{{EVIDENCE_FILENAME}}`

### Server & Database State
- **Server Log / Stack Trace:**
```text
{{SERVER_LOG}}
```
- **Database Discrepancy:** *(e.g., Row inserted with null foreign key, transaction not rolled back)*
