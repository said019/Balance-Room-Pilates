# Lost booking response recovery — 2026-09-20

WalkinPanel now reads the existing authorized class roster after a booking request has no HTTP response or returns exact ALREADY_BOOKED. It checks class identity and requires exactly one attendee with the selected user ID and confirmed/checked_in status. Only then does it retain the existing booking ID and call the existing idempotent manual attendance endpoint. Generic409, another user, waitlist/cancelled booking, missing or ambiguous identity do not become success.

No backend routes, privileges, price policy or courtesy logic changed. The existing /checkin/class/:classId staff authorization remains authoritative. Failure to recover leaves an explicit error without another debit.

Evidence outside checkout in evidence/walkin: recovery-red.log (RTL recovery case fails before fix); recovery-green.log (7RTL cases pass); recovery-build.log; recovery-playwright.log and playwright-ui.json. Two real mobile390x844 Chromium tests run against the built app/API/PG54355. The second intercepts admin-book after server201 has committed, then aborts the response: UI recovers and SQL still reports one paid membership payment, one booking debit/ledger, one live attendance, and balance4→3. No provider calls or production mutation.
