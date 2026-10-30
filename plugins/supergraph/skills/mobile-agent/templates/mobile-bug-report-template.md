# Mobile Defect Report: [DEFECT-ID]

> **Title:** `[Brief bug description]`  
> **Platform:** `[iOS | Android]`  
> **Severity:** `[Blocker | Critical | Major | Minor]`  
> **Priority:** `[P0 | P1 | P2]`  
> **Target App:** `[bundle_id / package_name]`  
> **Device:** `[Device Model | Serial/UDID: xxxx]`  
> **OS Version:** `[iOS 17.5 / Android 14]`  
> **Date:** `[YYYY-MM-DD HH:mm:ss]`

---

## 1. Description
[Detailed description of what went wrong on the mobile device]

---

## 2. Steps to Reproduce (Action Trace)
1. Start session on device
2. Snapshot screen: get `@ref` handles
3. Tap element: `tap(ref: "@e1")`
4. Fill input: `fill(ref: "@e2", text: "[test-input]")`
5. Tap action button: `tap(ref: "@e3")`

---

## 3. Expected vs Actual Result
- **Expected:** [What the user should see or experience]
- **Actual:** [What actually occurred, e.g. App crashed, element overlap, layout clipping]

---

## 4. Visual Evidence
![Defect Screenshot](evidence/[DEFECT-ID].png)
*Captured automatically via `screenshot` tool on real device.*

---

## 5. Device Diagnostic Logs
```text
[Paste relevant syslog, adb logcat, or crash stacktrace here]
```
