# Dark Coin wallet verification — development build

## Status
The standalone verification page now signs an exact zero-ALGO MainNet payment through the existing Pera/Defly bundle. The paired bot code is staged separately for review; neither production activation nor a real-wallet acceptance test has occurred. The bot, not browser state, decides ownership. Main and the old BasicQuilt production site remain unchanged.

## Preserved behavior
Existing store, swap, opt-in and prize-upload transaction scripts are unchanged. Approved charcoal/gold styling remains. Existing accounts retain gameplay and hybrid GOLD. New accounts must verify before activation; replacements remain pending until proof succeeds. Verification is separate from GOLD opt-in.

## Implementation
An expiring challenge is tied to the Discord user, claimed wallet and expected receiver. This page accepts that challenge in the fragment, connects the requested wallet and signs only a zero-ALGO payment with the exact note. It rejects a wrong network, excessive suggested fee or expired link. No rekey or close fields are constructed. Transaction identity is saved in session storage before broadcast; ambiguous sends are not blindly repeated.

The paired bot independently queries MainNet with bounded response size/time, checks confirmed sender/receiver/note/amount and challenge validity, and consumes the challenge with the account update. Withdrawal ownership checks precede reservation; repeated confirmation uses the same withdrawal identity.

## Validation performed
- 18 isolated bot/database integration checks, including forged/expired/replayed proofs, binding rollback, GOLD preservation and duplicate withdrawal confirmation.
- 7 signing-controller scenarios with an actual SDK transaction builder and mocked wallet/network: success, wrong wallet, cancellation, uncertain send, wrong network, expired link and reload.
- Existing slash-command definitions unchanged when feature flags are off; only the two new commands are conditionally added.
- Assembled bot source: 961 static SQL statements compile against copied schemas; syntax checks pass.
- Browser rendering and real Pera/Defly signing remain required before production activation. The available cloud browser cannot open the local preview URL; no claim of fresh visual or live-wallet acceptance is made.

## Deployment order
1. Review only the new verification/withdrawal prompts. Existing game messages are not rewritten.
2. Publish/test this fork, keeping the old site available.
3. Back up the current live bot before replacing only the changed/new bot files.
4. Set STORE_PAGE_BASE to the published fork's /store URL; paired bot code derives opt-in, swap, prize-upload and verification links from it.
5. Enable WALLET_VERIFICATION_ENABLED for a controlled verification test; keep ECOSYSTEM_GOLD_WITHDRAWALS_ENABLED disabled.
6. Owner signs the zero-ALGO transaction in their own wallet. Confirm Discord ownership and preserved balances.
7. Enable withdrawals only after this passes and custody address/signer, ASA opt-in, reserve funding and configured limits are checked. Perform one small controlled withdrawal.

Optional WALLET_VERIFICATION_PAGE_BASE and WALLET_VERIFICATION_RECEIVER override their derived defaults. No new web backend or production dependency is required. Never put bot credentials in this public site.

## Rollback
Disable the two feature flags and restore the prior website URL if needed. Keep the new database records and existing balances; do not restore a stale financial DB after transactions have occurred. Code rollback must retain the latest purchase-safety fixes. Reconcile any pending withdrawal before switching off its recovery lifecycle. Do not delete ownership history or payment rows as part of rollback.
