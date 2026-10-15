# Full-Stack QA Test Matrix: {{FEATURE_NAME}}

> Standard: ISTQB Full-Stack Verification | Engine: agent-browser (UI) + API Test Harness
> Date: {{DATE}} | Author: Supergraph QA Engineer

---

## 1. Scope & System Under Test (SUT)

- **Feature / Component:** `{{FEATURE_NAME}}`
- **Web UI Route:** `{{TARGET_URL}}`
- **API Endpoint:** `{{API_ENDPOINT}}`
- **Preconditions / Auth:** {{PRECONDITIONS}}

---

## 2. Part A: Web UI & Client E2E (agent-browser)

| TC ID | Category | Description | Precondition | User Action & Input Data | Expected UI Feedback | Actual Result | Status | Evidence |
|---|---|---|---|---|---|---|---|---|
| `TC-{{PREFIX}}-UI-001` | **Happy Path** | Valid complete UI flow | User on `{{TARGET_URL}}` | 1. Fill fields<br>2. Submit form | Success toast, redirect to next page, responsive layout | | `PENDING` | - |
| `TC-{{PREFIX}}-UI-002` | **Negative** | Client form validation | Form empty | 1. Click submit | Inline field errors rendered, network call blocked | | `PENDING` | - |
| `TC-{{PREFIX}}-UI-003` | **Boundary** | Input character clamp & formatting | Input focused | 1. Input MAX+1 chars | Field clamps or shows counter error, no layout shift | | `PENDING` | - |
| `TC-{{PREFIX}}-UI-004` | **Fault** | Network 500 error resilience | Form filled | 1. API responds 500 | Graceful error alert shown, retry button enabled | | `PENDING` | - |

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
- [ ] **Server Log:** Zero unhandled server stack traces or 5xx crashes.
- [ ] **Database Integrity:** Zero orphan records or uncommitted transaction locks.

---

## 5. Execution Summary

- **Total Test Cases:** `{{TOTAL_TC}}`
- **Passed:** `0` | **Failed:** `0` | **Blocked:** `0`
- **Overall Verdict:** `PENDING`
