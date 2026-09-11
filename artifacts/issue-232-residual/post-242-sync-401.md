# Post-#242 Sync → HTTP 401 residual (#232)

Relates to #232 only. Does **not** certify. Does **not** close #232. Parent #224 stays open.

## Verdict

**No second code fix shipped.** After #242 (`44fde92`, live on `https://auth.trove.ing`), signed-in personal Sync still returns oRPC `UNAUTHORIZED` (HTTP 401). Device evidence is on certification tip `8420b9e` (`cursor/workos-certify-migration-b3d1`). This write records what is ruled out, what remains, and the next evidence needed.

## Confirmed on `origin/main`

| Check                 | Result                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| Tip                   | `44fde92` — `fix(auth): stop API 401 on AuthKit tokens missing aud`                                     |
| `verifyAccessToken`   | Omits jose `audience`; `assertTokenBinding` requires `client_id === WORKOS_CLIENT_ID` when `aud` absent |
| Live Worker           | Deploy run for `44fde92` succeeded; root `GET /` → 200 OK                                               |
| Client ids (Mac cert) | `client_id_compare=EQUAL` (`artifacts/issue-232/client-id-compare.txt` on #241 branch)                  |

## Device residual (post-#242)

Source: #241 tip `8420b9ee8352` · `artifacts/issue-232/authkit-live-write.txt` · UI snaps `agent-device-after-sync*.txt` · `cfnetwork-401-summaries.txt`

| Fact                   | Evidence                                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Signed-in UI           | `stringsaeed@gmail.com`, Sign out (`authkit-56-*`, profile snaps)                                                             |
| Households path failed | "Household sync is paused" + Try again = `access.household.kind === "unavailable"`                                            |
| Sync path failed       | Sync just for me → UI text `Unauthorized` (`agent-device-sync-final.txt`)                                                     |
| Transport              | CFNetwork HTTP 401 on `auth.trove.ing` `/rpc` (18 summary lines, all status 401)                                              |
| Unauthenticated shape  | Live `POST /rpc/migration/getManifest` and `/rpc/households/listMine` without bearer → `{"code":"UNAUTHORIZED","status":401}` |

## Ruled out for this repro

### Empty Authorization from held claim alone

`useHouseholdRead` is enabled only when `probe?.kind === "session"` (`apps/mobile/modules/access/provider.tsx`). Households `isError` maps to `household.kind === "unavailable"`, which is what renders "Household sync is paused".

So for this UI state, `authClient.useSession()` had a SecureStore session (not merely a held identity claim). `getAccessToken()` shares `getValidSession()` with that probe.

Held-claim + `no_session` becomes `session_revoked`, where `signedInUserId` is null and Sync errors with "Sign in before…" rather than oRPC `Unauthorized`. That is **not** this screenshot.

### `request_bytes ≈ 799` ⇒ missing JWT

CFNetwork `request_bytes` is headers+body. Body ~29 bytes (`{"json":{"scope":"personal"}}`-sized). ~770 bytes of headers can still carry a short WorkOS access JWT, especially under HPACK/QPACK on a reused connection. **Do not** treat 799 as empty Authorization.

Same capture window contains **only** `response_status=401` Summary lines — no successful authenticated `/rpc` call to compare sizes against.

## Remaining hypotheses (need runtime claim/code)

Ranked. None proven without Worker verify-code logs or a redacted JWT claim dump.

1. **Token has `aud` (JWT template) that does not match resolved `WORKOS_TOKEN_AUDIENCE`**  
   After #242, present `aud` takes the audience branch and never falls back to `client_id`. Deploy workflow does not pass `WORKOS_TOKEN_AUDIENCE` (Alchemy default `""` → audience = `WORKOS_CLIENT_ID`). A dashboard template `aud` of e.g. an API URL would still 401.

2. **No-aud token missing or mismatched `client_id` claim**  
   Official WorkOS session-token docs include `client_id`. Some third-party decoded samples omit it. `#242` still rejects missing/mismatched `client_id` when `aud` is absent (`claim_client_id`).

3. **Issuer / JWKS mismatch**  
   Default issuer `https://api.workos.com` (slash variants accepted). Custom AuthKit domain would need `WORKOS_TOKEN_ISSUER` (+ JWKS still uses `WORKOS_CLIENT_ID`). No evidence of custom domain in repo config (`AUTH_HOSTNAME` is the Trove Worker, not WorkOS iss).

4. **Expired token + failed refresh race**  
   `getValidSession` refreshes within 10s of `exp`; refresh failure clears SecureStore and emits. Sustained Sign-out + unavailable UI still implies a session probe for households enablement; weak for the long-lived residual unless re-login restored a bad token.

5. **Ops: Alchemy-persisted custom `WORKOS_TOKEN_AUDIENCE`**  
   Not listed in Actions deploy `env:`; if Cloudflare/Alchemy state retained a non-empty audience from an older deploy, default session tokens (no `aud`) fail closed in `assertTokenBinding`. **Secret/env name only:** `WORKOS_TOKEN_AUDIENCE`. Value not readable from this agent (GH secrets API 403; Cloudflare observability MCP needsAuth).

## Diagnostics (this PR follow-up)

No second binding fix. `packages/api` now logs a redacted Worker console line on verify failure:

`access_token_verify_failed { code, payloadDecoded, hasAud, hasClientId }`

No token, claim values, or env values. Protected `UNAUTHORIZED` body/headers unchanged (oRPC shape has no safe slot today).

## Next evidence (names only / redacted)

1. After this branch deploys (or in wrangler/dev), one Sync tap should emit Worker console `access_token_verify_failed` with `{ code, payloadDecoded, hasAud, hasClientId }` only.
2. Confirm live Worker binding for `WORKOS_TOKEN_AUDIENCE` is empty or equals `WORKOS_CLIENT_ID` (name + equality only).

## Out of scope / hard-stop env names (unchanged)

Absent locally for PowerSync mint / PlanetScale (not required to fix bearer verify itself):

`POWERSYNC_URL`, `POWERSYNC_JWT_PRIVATE_KEY`, `POWERSYNC_JWT_KID`, `PLANETSCALE_HOST`, `PLANETSCALE_DATABASE`, `PLANETSCALE_USER`, `PLANETSCALE_PASSWORD`, `DATABASE_URL`

## Revision

| Field                | Value                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| Investigation branch | `cursor/sync-rpc-401-residual-b3d1`                                                            |
| Base                 | `origin/main` @ `44fde92`                                                                      |
| Cert evidence tip    | `8420b9ee8352` (#241)                                                                          |
| Skills               | poteto-mode (laziness / fix-root-causes / prove-it-works): no speculative second binding patch |
