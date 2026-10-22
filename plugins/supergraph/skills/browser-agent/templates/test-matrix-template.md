# QA Test Matrix: {{FEATURE_NAME}}

> Standard: ISTQB Foundation Level | Test Automation Engine: agent-browser (Rust CDP)
> Date: {{DATE}} | Author: Supergraph QA Engineer

---

## 1. Scope & System Under Test (SUT)

- **Feature / Component:** `{{FEATURE_NAME}}`
- **Target URL / Route:** `{{TARGET_URL}}`
- **Session ID:** `{{AGENT_BROWSER_SESSION}}`
- **Environment:** Headed / Headless Chrome (`agent-browser`)
- **Preconditions / Auth:** {{PRECONDITIONS}}

---

## 2. Test Execution Matrix

| TC ID | Category | Description | Precondition | Test Steps & Input Data | Expected Result | Actual Result | Status | Evidence |
|---|---|---|---|---|---|---|---|---|
| `TC-{{PREFIX}}-001` | **Happy Path** | Valid complete flow with standard inputs | User logged in / guest on route | 1. Navigate to route<br>2. Fill valid data<br>3. Submit | Success notification, correct URL redirect, state persisted | | `PENDING` | - |
| `TC-{{PREFIX}}-002` | **Negative** | Missing mandatory fields validation | Target form open | 1. Leave required fields blank<br>2. Click submit | Inline field errors displayed, form submission blocked | | `PENDING` | - |
| `TC-{{PREFIX}}-003` | **Negative** | Invalid data format (email, phone, type mismatch) | Target form open | 1. Input malformed string<br>2. Trigger blur/submit | Real-time validation warning, submission blocked | | `PENDING` | - |
| `TC-{{PREFIX}}-004` | **Boundary** | Min/Max boundary & payload length limits | Input fields | 1. Input 0 chars, 1 char, MAX+1 chars<br>2. Check counter/clamp | Input constrained or error message matches limit | | `PENDING` | - |
| `TC-{{PREFIX}}-005` | **Boundary** | Security probe payloads (XSS, SQLi strings) | Input fields | 1. Input `<script>alert(1)</script>`<br>2. Submit | Sanitized/escaped output, zero script execution | | `PENDING` | - |
| `TC-{{PREFIX}}-006` | **Fault** | Backend 500 / Network timeout resilience | Network connected | 1. Simulate 500 error on submit endpoint<br>2. Check UI | User-friendly error message, retry button, no white screen | | `PENDING` | - |
| `TC-{{PREFIX}}-007` | **RBAC** | Unauthorized access attempt to restricted action | Guest or Low-privilege role | 1. Directly access protected URL/action | Redirected to login/403 forbidden with clear notice | | `PENDING` | - |
| `TC-{{PREFIX}}-008` | **Accessibility** | axe-core WCAG 2.1 AA compliance audit | Page & forms loaded | 1. Run `agent-browser a11y --tags wcag2a,wcag2aa` | 0 critical/serious violations, accessible names on all controls | | `PENDING` | - |
| `TC-{{PREFIX}}-009` | **Responsive** | Mobile Viewport Layout Verification (375x812) | Default route open | 1. Run `agent-browser set viewport 375 812`<br>2. Snapshot UI | Zero horizontal scroll, touch targets ≥44px, nav collapse works | | `PENDING` | - |

---

## 3. Runtime Diagnostics & Quality Gates Checklist

- [ ] **Console Cleanliness:** Run `agent-browser console` — No unhandled React hydration errors, 0 runtime exceptions.
- [ ] **Unhandled Rejections:** Run `agent-browser errors` — Empty log.
- [ ] **Network Health:** Run `agent-browser network requests` — No 4xx/5xx requests on critical assets/endpoints.
- [ ] **Core Web Vitals:** Run `agent-browser vitals --json` — LCP < 2.5s, CLS < 0.1, TTFB < 800ms, React hydration clean.
- [ ] **Accessibility Gate:** Run `agent-browser a11y` — Zero WCAG 2.1 AA blockers.

---

## 4. Execution Summary

- **Total Test Cases:** `{{TOTAL_TC}}`
- **Passed:** `0` | **Failed:** `0` | **Blocked:** `0`
- **Overall Verdict:** `PENDING`
