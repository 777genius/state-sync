# state-sync

Minimal primitives for revision-based state synchronization.

Provides the shared types used by the **invalidation-pull** protocol:

- **`Revision`** — monotonic `u64` counter with saturating arithmetic
- **`SnapshotEnvelope<T>`** — generic `{ revision, data }` envelope
- **`InvalidationEvent`** — `{ topic, revision }` change notification
- **`compare_revisions()`** — canonical `u64` string comparison

## Usage

```rust
use state_sync::{InvalidationEvent, Revision, SnapshotEnvelope};

let rev = Revision::new(1);

let envelope = SnapshotEnvelope {
    revision: rev.to_string(),
    data: serde_json::json!({ "counter": 42 }),
};

let event = InvalidationEvent {
    topic: "settings".to_string(),
    revision: rev.to_string(),
};
```

## License

MIT
