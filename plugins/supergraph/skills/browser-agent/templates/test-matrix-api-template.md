# API & Backend QA Test Matrix: {{FEATURE_NAME}}

> Standard: ISTQB Foundation Level | Test Scope: REST / GraphQL / RPC Endpoints
> Date: {{DATE}} | Author: Supergraph QA Engineer

---

## 1. Scope & System Under Test (SUT)

- **Feature / Service:** `{{FEATURE_NAME}}`
- **Base URL / Endpoint:** `{{TARGET_URL}}`
- **Protocol:** HTTP/1.1 or HTTP/2 (JSON REST / GraphQL)
- **Authentication / Auth Header:** {{PRECONDITIONS}}

---

## 2. API Test Execution Matrix

| TC ID | Category | Endpoint & Method | Precondition / Auth | Request Payload / Query Params | Expected Status & Response Contract | Database / State Assertion | Status | Evidence |
|---|---|---|---|---|---|---|---|---|
| `TC-{{PREFIX}}-001` | **Happy Path** | `POST {{TARGET_URL}}` | Valid Auth Token | Complete valid JSON body | `200 OK` / `201 Created`, schema matches OpenAPI/contract | DB record inserted with matching attributes | `PENDING` | - |
| `TC-{{PREFIX}}-002` | **Negative** | `POST {{TARGET_URL}}` | Valid Auth Token | Missing mandatory body fields | `400 Bad Request` / `422 Unprocessable`, detailed field error array | Zero DB modification (atomic rollback) | `PENDING` | - |
| `TC-{{PREFIX}}-003` | **Negative** | `POST {{TARGET_URL}}` | Valid Auth Token | Malformed JSON / Invalid data types | `400 Bad Request`, standard error format (no stack trace) | Zero DB modification | `PENDING` | - |
| `TC-{{PREFIX}}-004` | **Boundary** | `POST {{TARGET_URL}}` | Valid Auth Token | Max payload length / extreme values (0, MAX+1, empty array) | Valid values accepted; oversized rejected with `413` or `422` | Data integrity maintained, no truncated corrupted state | `PENDING` | - |
| `TC-{{PREFIX}}-005` | **Boundary / Sec** | `GET/POST {{TARGET_URL}}` | Valid Auth Token | Injection probe payload (`' OR 1=1`, `<svg onload=alert(1)>`, `../`) | `400 Bad Request` or safely escaped; zero SQLi/command execution | Query parameterized; zero raw query interpolation | `PENDING` | - |
| `TC-{{PREFIX}}-006` | **Fault** | `ANY {{TARGET_URL}}` | Downstream unavailable | Simulated DB timeout / 3rd party API 500 | `503 Service Unavailable` or `504 Gateway Timeout`, graceful retry advice | Clean transaction abort; zero connection pool exhaustion | `PENDING` | - |
| `TC-{{PREFIX}}-007` | **RBAC / Auth** | `ANY {{TARGET_URL}}` | Missing / Expired Token | Valid payload | `401 Unauthorized` | Zero action executed | `PENDING` | - |
| `TC-{{PREFIX}}-008` | **IDOR / Tenant** | `GET {{TARGET_URL}}/:id` | Valid Token (User A) | Accessing resource ID belonging to User B | `403 Forbidden` or `404 Not Found` | User A cannot read or mutate User B data | `PENDING` | - |

---

## 3. Security & Non-Functional Verification

- [ ] **Security Headers:** Response includes `X-Content-Type-Options: nosniff`, strict `CORS`, no internal server versions exposed (`Server`, `X-Powered-By`).
- [ ] **Zero Sensitive Data Leakage:** Error responses never expose database connection strings, passwords, or raw stack traces.
- [ ] **Latency Budget:** p95 latency under target SLA (< 200ms for OLTP queries).

---

## 4. Execution Summary

- **Total Test Cases:** `{{TOTAL_TC}}`
- **Passed:** `0` | **Failed:** `0` | **Blocked:** `0`
- **Overall Verdict:** `PENDING`
