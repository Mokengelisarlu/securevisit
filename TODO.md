# TODO - Device diviceId pairing idempotency

- [x] Update tenant devices schema: add `diviceId` column (tenant-scoped uniqueness)

- [ ] Create migration for the new column + unique constraint
- [ ] Update `features/tenants/queries/tenant-data.ts`:
  - [ ] Change `generatePairingCode` to accept `diviceId`
  - [ ] If `(tenantId, diviceId)` exists: reuse the existing device row (reset pairing state)
  - [ ] Else: create new device row
- [ ] Update API route `app/api/tenants/[slug]/devices/pairing-code/route.ts` to accept `diviceId` in body
- [ ] Update mobile:
  - [ ] Implement persistent `diviceId` generation + local storage
  - [ ] Update `mobile-app/src/hooks/usePairing.ts` to send `diviceId` when generating pairing code
- [ ] Update/align types in `mobile-app/src/types/api.ts`
- [ ] Run migration(s) and a quick smoke test of pairing flow

