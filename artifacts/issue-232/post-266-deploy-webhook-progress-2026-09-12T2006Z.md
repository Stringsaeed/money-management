# Post-#266 Deploy SUCCESS + webhook progress (Relates #232)

**Stamped:** 2026-09-12T20:06Z (UTC)  
**Cert PR:** [#241](https://github.com/Stringsaeed/money-management/pull/241) tip parent `0c0aea66`  
**Worktree:** `/tmp/wt-241-post266` (root `/workspace` stayed on `main` @ `33a8ba23`)  
**Relates:** #232 only — does **not** close #232 / #224

## 1. Deploy Worker after #266 merge

| Field | Value |
| --- | --- |
| Merge | [#266](https://github.com/Stringsaeed/money-management/pull/266) squash → `main` `33a8ba23e4cb1959d24dd3eb47f39e7f62e71d8f` |
| Run | [34715924235](https://github.com/Stringsaeed/money-management/actions/runs/34715924235) |
| Job | Alchemy deploy `103613026602` |
| Conclusion | **SUCCESS** (1m7s) |

### Ensure post-cutover schema (0011–0015)

Step **success** (exit 0). Soft-fail path confirmed:

- Many `42501` `alter_permission_denied` warnings (must be owner / permission denied for schema public)
- Follow-on `42703` soft-fail: `missing_schema_object_after_permission_denied` — `column "visibility" does not exist` on `0015_remove_legacy_auth_and_private_accounts` (expected post-0015; privileged schema already applied)
- Final JSON: `"ok": true`, `"alter_permission_denied": true`, `"code": "42501"`, presence checks all **true**
- Next step **Deploy Worker** ran (not skipped)

### Deploy Worker step

- `workos_webhook_secret_set=yes` (presence only; value never logged)
- Alchemy plan: `[server] update`, `[server/WORKOS_WEBHOOK_SECRET] update`
- Done: 2 succeeded → `{ server: 'https://auth.trove.ing' }`

## 2. Live webhook probe (`2026-09-12T20:06:41Z`)

| Request | Status | Body |
| --- | --- | --- |
| `GET https://auth.trove.ing/` | **200** | `OK` |
| `POST /webhooks/workos` `{}` no signature | **400** | `Missing WorkOS-Signature header.` |
| `POST /webhooks/workos` + fake `WorkOS-Signature` | **401** | `Signature verification failed.` |

**Progress:** was **503** secret-missing; now secret is live in prod. Receiver accepts signature gate.

Raw: `workos-webhook-probe-2026-09-12T200641Z.txt`

## 3. Signed delivery

Agent env `WORKOS_WEBHOOK_SECRET` = **MISSING**. Signed probe **SKIPPED** — secret **not invented**.

## 4. Matrix impact

- Webhook **secret-wiring / Deploy gate** → **unblocked** (400/401 progress).
- Row **4** webhook-driven membership apply → still needs **valid signed WorkOS delivery** (+ owner retry of failed deliveries) before PASS; not claimed here.
- Create Account / NativeButton (#258–#265) remain **PARKED**.
- `CERT_USER_*`, PowerSync mint, Android, OTP AX, signed-in Mac session remain owner-blocked.

## Governance

Relates to #232 only. Do not Closes/Fixes #232 or #224. Do not merge #241 as certified. Do not invent secrets.
