# TODO - Device diviceId pairing idempotency

- [x] Update tenant devices schema: add `diviceId` column (tenant-scoped uniqueness)

- [x] Create migration for the new column + unique constraint
- [x] Update `features/tenants/queries/tenant-data.ts`:
  - [x] Change `generatePairingCode` to accept `diviceId`
  - [x] If `(tenantId, diviceId)` exists: reuse the existing device row (reset pairing state)
  - [x] Else: create new device row
- [x] Update API route `app/api/tenants/[slug]/devices/pairing-code/route.ts` to accept `diviceId` in body
- [x] Update mobile:
  - [x] Implement persistent `diviceId` generation + local storage
  - [x] Update `mobile-app/src/hooks/usePairing.ts` to send `diviceId` when generating pairing code
- [x] Update/align types in `mobile-app/src/types/api.ts`
- [x] Run migration(s) and a quick smoke test of pairing flow



