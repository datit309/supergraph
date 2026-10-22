# Full-Stack QA Test Matrix: {{FEATURE_NAME}}

> Standard: ISTQB Full-Stack Verification | Engine: agent-browser (UI) + API Test Harness
> Date: {{DATE}} | Author: Supergraph QA Engineer

---

## 1. Scope & System Under Test (SUT)

- **Feature / Component:** `{{FEATURE_NAME}}`
- **Web UI Route:** `{{TARGET_URL}}`
- **API Endpoint:** `{{API_ENDPOINT}}`
- **Session ID:** `{{AGENT_BROWSER_SESSION}}`
- **Preconditions / Auth:** {{PRECONDITIONS}}

---

## 2. Part A: Web UI & Client E2E (agent-browser)

| TC ID | Category | Description | Precondition | User Action & Input Data | Expected UI Feedback | Actual Result | Status | Evidence |
|---|---|---|---|---|---|---|---|---|
| `TC-{{PREFIX}}-UI-001` | **WebMCP / Happy** | Native WebMCP Tool Discovery or UI Flow | User on `{{TARGET_URL}}` | 1. `agent-browser webmcp list`<br>2. Fill fields or invoke tool | Success toast, redirect to next page, responsive layout | | `PENDING` | - |
| `TC-{{PREFIX}}-UI-002` | **Negative** | Client form validation | Form empty | 1. Click submit | Inline field errors rendered, network call blocked | | `PENDING` | - |
| `TC-{{PREFIX}}-UI-003` | **Boundary** | Input character clamp & formatting | Input focused | 1. Input MAX+1 chars | Field clamps or shows counter error, no layout shift | | `PENDING` | - |
| `TC-{{PREFIX}}-UI-004` | **Fault** | Network 500 error resilience | Form filled | 1. API responds 500 | Graceful error alert shown, retry button enabled | | `PENDING` | - |
| `TC-{{PREFIX}}-UI-005` | **Accessibility** | axe-core WCAG 2.1 AA Compliance | View open | 1. Run `agent-browser a11y` | 0 serious violations, valid ARIA attributes | | `PENDING` | - |
| `TC-{{PREFIX}}-UI-006` | **Responsive** | Mobile Viewport Layout (375x812) | Mobile view | 1. Run `agent-browser set viewport 375 812` | Zero horizontal overflow, touch friendly | | `PENDING` | - |

---

## 3. Part B: API Endpoints & Data Integrity

| TC ID | Category | Method & Endpoint | Auth State | Request Payload | Expected Status & Response | Database Assertion | Status | Evidence |
|---|---|---|---|---|---|---|---|---|
| `TC-{{PREFIX}}-API-001` | **Happy Path** | `POST {{API_ENDPOINT}}` | Bearer Token | Valid payload matching schema | `200/201`, JSON schema validated | Row persisted in DB with correct values | `PENDING` | - |
| `TC-{{PREFIX}}-API-002` | **Negative** | `POST {{API_ENDPOINT}}` | Bearer Token | Missing mandatory attributes | `400/422`, structured error list | DB unmutated | `PENDING` | - |
| `TC-{{PREFIX}}-API-003` | **Security** | `POST {{API_ENDPOINT}}` | No Auth Header | Valid payload | `401 Unauthorized` | DB unmutated | `PENDING` | - |
| `TC-{{PREFIX}}-API-004` | **IDOR** | `GET {{API_ENDPOINT}}/:id` | Tenant A Token | Accessing Tenant B resource ID | `403 Forbidden` / `404 Not Found` | No data leakage | `PENDING` | - |

---

## 4. Diagnostics & System Health

- [ ] **Client Console:** `agent-browser console` — Zero uncaught client exceptions.
- [ ] **Client Errors:** `agent-browser errors` — Zero unhandled Promise rejections.
- [ ] **Core Web Vitals:** `agent-browser vitals --json` — LCP < 2.5s, CLS < 0.1, TTFB < 800ms.
- [ ] **Accessibility Gate:** `agent-browser a11y` — axe-core WCAG 2.1 AA pass.
- [ ] **Server Log:** Zero unhandled server stack traces or 5xx crashes.
- [ ] **Database Integrity:** Zero orphan records or uncommitted transaction locks.

---

## 5. Execution Summary

- **Total Test Cases:** `{{TOTAL_TC}}`
- **Passed:** `0` | **Failed:** `0` | **Blocked:** `0`
- **Overall Verdict:** `PENDING`
