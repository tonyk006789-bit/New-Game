# Policy references, not a backend
These pure functions validate supplied data and plan a balanced administrator posting. They do not authenticate a user, persist changes, reserve credits, enforce database concurrency, write audit events, deduplicate requests or execute a game. A `stepUpVerified` field is only a trusted-server-input fixture; accepting it from a client would be insecure. The production service must implement all those checks independently.

The slot decision checker validates fields only. Owner approval authentication, mathematical proof, paytable matching and release authorization are not implemented by this helper. Tests deliberately distinguish a fixture approval from the shipped pending production decision.
