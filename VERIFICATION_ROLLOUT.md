# Dark Coin wallet verification rollout

## Current stage
Visual theme and a non-transactional preview only. Wallet verification has not been implemented. Existing transaction JavaScript is unchanged; no live bot links have been migrated.

## Approved rules
- Existing registered users retain normal gameplay, balances, and accounts.
- Existing users must verify before withdrawing GOLD. Check before debiting or broadcasting.
- New users verify before registration completes.
- A wallet change remains pending until the replacement wallet is verified.
- Verified users do not repeat verification unless their wallet changes.
- GOLD opt-in and wallet ownership verification are separate operations.

## Implementation requirements
A unique expiring challenge is bound to the Discord account and claimed wallet. A confirmed zero-ALGO payment must match the expected network, sender, receiver, and exact challenge note. Reject rekey/close operations, reused challenges/transactions, and wallets verified to another Discord account. The browser never decides verification status; the bot verifies chain data. Final account binding and verification must not leave the legacy account and ecosystem wallet stores inconsistent.

## Required tests before cutover
Wrong wallet/network/note/receiver, expired or reused challenges, duplicate clicks, cancellation, account conflicts, wallet changes, and failed database writes. Exercise existing Store payment, NFT opt-in, swap, and prize deposit flows on desktop/mobile. Inspect transaction fields before signing. No real payment is authorized by a UI test.

## Rollback
Website baseline: commit 1bf23bcfeb5e5df03e9fc519fbd805508a585617, branch rollback/pre-wallet-verification-2026-09-28. Existing site remains https://basicquilt.github.io/darkcoinswap/ and existing bot links remain there until approval.

Before bot deployment, make a fresh stopped-server backup and retain the exact previous changed files/config. A rollback after players resume should restore code/config without overwriting newer player data. Never restore a stale database over live progress or replay confirmed withdrawals. Confirm compatibility of the prior code with any additive schema before release. Website baseline is preserved; a full bot rollback drill is still pending.
