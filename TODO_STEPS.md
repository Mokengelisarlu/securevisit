# TODO implementation steps

- [x] Create tenant migration: add `divice_id` column uniqueness constraint

- [x] Update `features/tenants/queries/tenant-data.ts`:
  - [x] Update `generatePairingCode(tenantSlug, diviceId)`
  - [x] Reuse existing device row for same `diviceId` and reset pairing state

- [x] Update API route `app/api/tenants/[slug]/devices/pairing-code/route.ts` to accept `diviceId`

- [x] Update mobile:
  - [x] Implement persistent `diviceId` generation + storage
  - [x] Update `mobile-app/src/hooks/usePairing.ts` to send `diviceId`
  - [x] Update `mobile-app/src/types/api.ts` if needed

- [ ] Run migrations
- [ ] Smoke test pairing flow



