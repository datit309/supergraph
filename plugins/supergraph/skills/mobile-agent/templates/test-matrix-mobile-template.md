# Mobile QA Test Matrix: [Feature Name]

> **Platform:** `[iOS | Android | Cross-Platform]`  
> **Target App:** `[com.example.bundleid / package]`  
> **Target Device:** `[iPhone 15 Pro / Samsung Galaxy / Simulator / Emulator]`  
> **OS Version:** `[iOS 17.5 / Android 14]`  
> **Tester:** `Supergraph mobile-agent (WDA & UiAutomator2)`  
> **Date:** `[YYYY-MM-DD]`

---

## 1. Test Environment & Prerequisites
- [ ] Device connected via USB / ADB / usbmuxd and authorized.
- [ ] Test server active (WDA on port 8100 for iOS or UiAutomator2 on port 6790 for Android).
- [ ] Port forwarding established (`iproxy 8100 8100` or `adb forward tcp:6790 tcp:6790`).
- [ ] Target application installed and ready.

---

## 2. Test Matrix (7 Dimensions - ISTQB Mobile Standard)

| ID | Dimension | Test Case / Scenario | Action Steps | Expected Outcome | Status | Evidence |
|---|---|---|---|---|---|---|
| **MOB-01** | Happy Path | Primary user journey (e.g. Login / Checkout) | 1. Fill input (@e1)<br>2. Fill input (@e2)<br>3. Tap action (@e3) | Action succeeds, target view loaded | Pending | `screenshots/mob-01.png` |
| **MOB-02** | Negative Path | Form validation on empty or invalid inputs | 1. Enter invalid input<br>2. Submit | Error banner/label visible, no crash | Pending | `screenshots/mob-02.png` |
| **MOB-03** | Safe Area & Navigation | Notches, Dynamic Island & Back navigation | 1. Check layout bounds<br>2. Test Back action (iOS swipe / Android keycode 4) | UI padded properly, returns to parent screen | Pending | `screenshots/mob-03.png` |
| **MOB-04** | Keyboard Obstruction | Soft keyboard input & dismissal | 1. Focus bottom input<br>2. Dismiss keyboard (`dismissKeyboard` / `hideKeyboard`) | Keyboard hides, bottom buttons unobstructed | Pending | `screenshots/mob-04.png` |
| **MOB-05** | App Lifecycle | Backgrounding and reactivation | 1. Enter partial data<br>2. Press Home button<br>3. Reactivate app | Data preserved, no Activity/ViewController reset | Pending | `screenshots/mob-05.png` |
| **MOB-06** | System Permissions | Camera / Location permission dialog | 1. Trigger action needing permission<br>2. Handle alert (`accept` / `dismiss`) | System alert handled gracefully | Pending | `screenshots/mob-06.png` |
| **MOB-07** | Network Resilience | Offline state handling | 1. Cut network<br>2. Refresh screen | Offline message displayed, no unhandled exception | Pending | `screenshots/mob-07.png` |

---

## 3. Execution Summary
- **Total Test Cases:** 7
- **Passed:** 0
- **Failed:** 0
- **Blocked:** 0
- **Defects Logged:** See `docs/qa/mobile-bug-*.md`
