# iOS OTP / AuthKit callback — durable AX BLOCKER (owner decision)

Relates to #232 only. **Never** Closes/Fixes #232 or #224.
This is a **BLOCKER** note for automation — **not** a PASS and **not** a product defect claim.

## Verdict

| Field | Value |
| --- | --- |
| Status | **BLOCKED** (agent-device automation) |
| Product implication | Row 2 email-code completion + PKCE callback **not certified** via automation |
| Alternate proven path | Signed-in session already used for Sync probes (owner/manual or prior non-OTP session) — does **not** certify the OTP/callback sub-criteria |
| Owner decision needed | Accept automation blocker + certify OTP via human/manual evidence later, **or** require alternate automation (Maestro/Appium/manual) before row-2 complete |

## What was proven (prior #241 artifacts)

| Step | Result | Evidence |
| --- | --- | --- |
| Open sign-in sheet | reached | `authkit-03-sheet-open.png` |
| Cancel abandoned sign-in | **PASS** | `authkit-04-cancel.png` |
| Continue → system browser AuthKit | reached | `authkit-06-authkit-browser.png` … |
| Email page + fill email | **PARTIAL** | `authkit-07-workos-page.png`, `authkit-08-email-filled.png` |
| 6-box code challenge UI | reached | `authkit-09-code-challenge.png`, `authkit-19-final-otp.png` |
| Enter OTP digits via agent-device | **BLOCKED** | AX unavailable inside `ASWebAuthenticationSession`; `fill` selects page text instead of digit boxes |
| PKCE callback / signed-in from OTP path | **not evidenced** | Final OTP-path UI remained signed out (`authkit-21-signed-out-final.png`) |
| Android AuthKit | **not started** | — |

Canonical narrative: `acceptance-matrix.md` row 2; stamp `authkit-live-write.txt` (`row2_email_challenge=PARTIAL … OTP digit boxes AX-unavailable`).

## What this blocker is **not**

- Not a claim that WorkOS AuthKit OTP is broken for humans.
- Not clearance to mark row 2 complete.
- Not an env-name hard-stop (`WORKOS_*` names were present on the Mac cert host).
- Not evidence against JWT/`listMine`/`getManifest` (those used an already-signed-in session and are tracked separately as **PASS**).

## Recommended owner options

1. **Accept BLOCKER for automation** — keep OTP/callback sub-criteria open; continue certifying non-OTP rows; schedule a human OTP+callback capture later.
2. **Require alternate automation** — Maestro / manual operator / non-AX injection path that can type into AuthKit digit boxes before claiming row-2 PASS.
3. **Narrow row-2** (product decision) — explicitly accept cancel + hosted challenge reachability + post-login JWT/API as sufficient for this release; document OTP as best-effort. **Requires explicit owner write** — agents must not silently narrow.

## Governance

- Relates to #232 only.
- Parent #224 stays open until owner review after children complete.
- Do not treat this file as certification complete.
