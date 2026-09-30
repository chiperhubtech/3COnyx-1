---
name: Service request separation
description: Why member service-desk requests are separate from the vendor-bid sourcing engine and global notifications
---

Keep the member service desk separate from the vendor-bid sourcing flow. Status updates should be owner-scoped, with a durable actor-attributed event record; do not put private request details into the legacy global notification feed.

**Why:** The sourcing engine requires vendor bidding and award decisions, which do not match a direct member-to-operations request. The existing notification feed has no recipient ownership and is globally readable, so using it for member-specific service updates could disclose private details.

**How to apply:** For future services changes, use the service request's member ownership and event history for notification delivery and auditing; only reuse the global feed after it has a secure per-recipient authorization model.