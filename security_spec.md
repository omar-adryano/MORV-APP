# MORV AI Platform Security Specification & TDD Spec

## Data Invariants
1. A transaction, budget, savings goal, debt, subscription, task, habit, invoice, file, or chat history entry belongs exclusively to its creator (`userId`). It can never be viewed or updated by other authenticated users.
2. A user profile document can only be written (created or updated) by the authenticated user matching the document ID (`request.auth.uid == userId`).
3. To prevent self-assigned admin privileges, authorization fields or administrative access can only be verified by server verification or lookups. No user profile is allowed to elevate privileges client-side.
4. Timestamps like `createdAt` and `updatedAt` are immutable or verified using `request.time`.

## The "Dirty Dozen" Payloads (Exploit Attempts)
Below are 12 JSON payloads designed to compromise the security rules, attempting to bypass validation, spoof identity, escalate privileges, or poison resources.

1. **Self-Assign User Profile Hack**: Standard user trying to write a profile with a custom administrative claim.
2. **Identity Theft Write**: Authenticated User `A` tries to write an invoice directly to User `B`'s `/users/userB/invoices/invoice1` subcollection.
3. **Transaction Poisoning**: Positive expense transaction payload injected with a 50MB junk string inside `title` to attempt Denial of Wallet.
4. **Out-of-Bounds Negative Expense**: Inputting a negative amount `-12,000` to a transaction record to arbitrarily adjust cash balances.
5. **Orphaned Sub-Resource Injection**: Creating a transaction under a user ID that does not exist in the root users collection.
6. **Task Priority Malformation**: Creating a task with a spoofed priority field set to `ultra-critical-royal` which violates the `['high', 'medium', 'low']` enum constraint.
7. **Habit Streak Manipulation**: Standard user updating their own habit document to directly overwrite and boost their streak counter to `999,999` without actual day-by-day accomplishments.
8. **PII Data Leakage Scan**: An unauthorized guest or other authenticated user trying to read `/users/targetUser/` profile which contains private metadata.
9. **Invisible Field Inject**: Setting custom system keys like `isServerControlled: true` on an invoices structure to trick database state controllers.
10. **State Shortcutting**: Updating an unpaid invoice straight to "paid" without fulfilling compliance or verification flags.
11. **Immotable ID Hijacking**: Altering a transaction's `id` during an update call to disconnect database relational integrity.
12. **Malicious ID Characters**: Writing a document under a path with backslash or toxic terminal commands like `../../maliciousDoc` to cause folder traversal.

All 12 attempts must be rejected with a `PERMISSION_DENIED` error.
