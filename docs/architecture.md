# Architecture

How state-sync keeps your app state consistent across windows, tabs, and processes.

## High-level overview

The library implements an **invalidation-pull** protocol: a lightweight event signals that something changed, and the receiver pulls the latest snapshot on demand.

```mermaid
flowchart LR
  subgraph Source["Source of Truth"]
    B["Backend / Main Process"]
  end

  subgraph Protocol["Invalidation-Pull Protocol"]
    direction TB
    E["InvalidationEvent\n{ topic, revision }"]
    S["SnapshotEnvelope\n{ revision, data }"]
  end

  subgraph Consumer["Consumer Window"]
    direction TB
    RS[RevisionSync Engine]
    SA[SnapshotApplier]
    Store["App State\n(Pinia / Zustand / Vue / ...)"]
  end

  B -- "1. emit event" --> E
  E -- "2. notify" --> RS
  RS -- "3. fetch snapshot" --> S
  S -- "4. return data" --> RS
  RS -- "5. apply if newer" --> SA
  SA -- "6. update" --> Store

  style Source fill:#4f46e5,color:#fff,stroke:#4338ca
  style Protocol fill:#f59e0b,color:#000,stroke:#d97706
  style Consumer fill:#10b981,color:#fff,stroke:#059669
```

## Package structure

```mermaid
graph TB
  Core["@statesync/core\n\nRevisionSync engine\nRevision utilities\nThrottling & retry\nLogger"]

  Persistence["@statesync/persistence\n\nStorage backends\nSchema migrations\nCompression\nCross-tab sync"]

  Pinia["@statesync/pinia"]
  Zustand["@statesync/zustand"]
  Valtio["@statesync/valtio"]
  VueAdapter["@statesync/vue"]
  Svelte["@statesync/svelte"]
  Tauri["@statesync/tauri"]

  Core --> Persistence
  Core --> Pinia
  Core --> Zustand
  Core --> Valtio
  Core --> VueAdapter
  Core --> Svelte
  Core --> Tauri

  subgraph Framework["Framework Adapters"]
    Pinia
    Zustand
    Valtio
    VueAdapter
    Svelte
  end

  subgraph Transport["Transport Adapters"]
    Tauri
  end

  style Core fill:#4f46e5,color:#fff,stroke:#4338ca
  style Persistence fill:#7c3aed,color:#fff,stroke:#6d28d9
  style Framework fill:#10b981,color:#fff,stroke:#059669
  style Transport fill:#f59e0b,color:#000,stroke:#d97706
```

All framework and transport adapters depend only on `@statesync/core`. The persistence layer is optional.

## Core protocol

The sync engine follows a strict sequence to guarantee consistency:

```mermaid
sequenceDiagram
  participant B as Backend
  participant Sub as InvalidationSubscriber
  participant Engine as RevisionSync Engine
  participant Provider as SnapshotProvider
  participant Applier as SnapshotApplier
  participant Store as App State

  B->>Sub: emit { topic: "settings", revision: "42" }
  Sub->>Engine: handleInvalidation(event)

  Note over Engine: Compare revisions:<br/>event.revision > localRevision?

  alt Stale event (revision <= local)
    Engine-->>Engine: Skip (already up to date)
  else New revision
    Engine->>Engine: Throttle / debounce
    Engine->>Provider: getSnapshot("settings")
    Provider-->>Engine: { revision: "42", data: {...} }

    Note over Engine: Validate snapshot:<br/>revision is canonical?<br/>revision > localRevision?

    Engine->>Applier: apply({ revision: "42", data: {...} })
    Applier->>Store: patch / replace state
    Engine->>Engine: localRevision = "42"
  end
```

## Coalescing strategy

When multiple invalidation events arrive in rapid succession, the engine coalesces them to prevent refresh spam:

```mermaid
stateDiagram-v2
  [*] --> Idle

  Idle --> Refreshing: Event received
  Refreshing --> Idle: Refresh complete\n(no queued)
  Refreshing --> Refreshing: Event during refresh\n(queue ONE refresh)
  Refreshing --> Draining: Refresh complete\n(queued refresh exists)
  Draining --> Idle: Queued refresh complete

  note right of Refreshing
    At most 1 queued refresh.
    N events during refresh
    collapse into 1 extra refresh.
  end note
```

This means even 100 events firing in a burst result in at most **2 refreshes** — not 100.

## Data flow with persistence

When the persistence layer is enabled, it wraps the applier to add storage, compression, and cross-tab broadcast:

```mermaid
flowchart TB
  subgraph Incoming["Incoming Snapshot"]
    Snap["SnapshotEnvelope\n{ revision, data }"]
  end

  subgraph PersistenceLayer["Persistence Layer"]
    direction TB
    PA["PersistenceApplier"]
    Migrate["Schema Migration\n(if version mismatch)"]
    Compress["Compression\n(LZ-String / custom)"]
    Backend["Storage Backend\n(localStorage / IndexedDB)"]
    CrossTab["Cross-Tab Sync\n(BroadcastChannel)"]
  end

  subgraph App["Application"]
    Inner["Framework Applier\n(Pinia / Zustand / ...)"]
    Store["App State"]
  end

  Snap --> PA
  PA --> Inner
  Inner --> Store
  PA --> Migrate
  Migrate --> Compress
  Compress --> Backend
  PA --> CrossTab
  CrossTab -- "other tabs" --> PA

  style Incoming fill:#f59e0b,color:#000,stroke:#d97706
  style PersistenceLayer fill:#7c3aed,color:#fff,stroke:#6d28d9
  style App fill:#10b981,color:#fff,stroke:#059669
```

## Startup sequence

```mermaid
sequenceDiagram
  participant App as Application
  participant Engine as RevisionSync
  participant Storage as Persistence
  participant Provider as SnapshotProvider
  participant Applier as SnapshotApplier

  App->>Engine: createRevisionSync(opts)
  App->>Engine: start()

  opt Persistence enabled
    Engine->>Storage: load()
    Storage-->>Engine: cached snapshot (or null)
    Engine->>Applier: apply(cached)
    Note over Engine: localRevision = cached.revision
  end

  Engine->>Engine: subscribe to invalidation events
  Engine->>Provider: getSnapshot() (initial refresh)
  Provider-->>Engine: latest snapshot

  alt Snapshot is newer than cache
    Engine->>Applier: apply(latest)
    Note over Engine: localRevision = latest.revision
  else Cache is already up to date
    Engine-->>Engine: Skip apply
  end

  Note over Engine: Ready — listening for events
```

## Revision comparison

Revisions are canonical `u64` decimal strings (`"0"`, `"42"`, `"1843674407370955161"`). Comparison is simple and fast:

```mermaid
flowchart TD
  A["compareRevisions(a, b)"] --> B{"len(a) vs len(b)?"}
  B -- "len(a) < len(b)" --> Less["-1 (a < b)"]
  B -- "len(a) > len(b)" --> Greater["1 (a > b)"]
  B -- "same length" --> C{"string compare a vs b"}
  C -- "a < b" --> Less
  C -- "a > b" --> Greater
  C -- "a === b" --> Equal["0 (equal)"]

  style A fill:#4f46e5,color:#fff,stroke:#4338ca
  style Less fill:#ef4444,color:#fff,stroke:#dc2626
  style Greater fill:#10b981,color:#fff,stroke:#059669
  style Equal fill:#6b7280,color:#fff,stroke:#4b5563
```

No cryptographic hashing. No timestamps. Just monotonic integers — simple and reliable.

## Error handling phases

The engine reports errors with structured context, including which phase of the sync cycle failed:

```mermaid
flowchart LR
  Start["start()"] --> Subscribe["subscribe"]
  Subscribe --> Inv["invalidation"]
  Inv --> Refresh["refresh"]
  Refresh --> GetSnap["getSnapshot"]
  GetSnap --> Proto["protocol\n(validation)"]
  Proto --> Apply["apply"]

  Start -.-> |"setup error"| ErrStart["Phase: start"]
  Subscribe -.-> |"subscription failed"| ErrSub["Phase: subscribe"]
  Inv -.-> |"event validation"| ErrInv["Phase: invalidation"]
  Refresh -.-> |"refresh cycle"| ErrRefresh["Phase: refresh"]
  GetSnap -.-> |"provider failed"| ErrSnap["Phase: getSnapshot"]
  Proto -.-> |"bad revision"| ErrProto["Phase: protocol"]
  Apply -.-> |"applier threw"| ErrApply["Phase: apply"]

  style ErrStart fill:#ef4444,color:#fff,stroke:#dc2626
  style ErrSub fill:#ef4444,color:#fff,stroke:#dc2626
  style ErrInv fill:#ef4444,color:#fff,stroke:#dc2626
  style ErrRefresh fill:#ef4444,color:#fff,stroke:#dc2626
  style ErrSnap fill:#ef4444,color:#fff,stroke:#dc2626
  style ErrProto fill:#ef4444,color:#fff,stroke:#dc2626
  style ErrApply fill:#ef4444,color:#fff,stroke:#dc2626
```

Each error includes `phase`, `topic`, `localRevision`, `error`, and optional `eventRevision` / `snapshotRevision` — making debugging straightforward.

## Design principles

| Principle | How it's applied |
|-----------|-----------------|
| **Transport-agnostic** | Core knows nothing about Tauri, WebSocket, or BroadcastChannel. You provide a subscriber + provider. |
| **Framework-agnostic** | Core knows nothing about Pinia, Zustand, or Vue. You provide an applier function. |
| **Source of truth** | One canonical backend. All windows pull from the same provider. No circular sync. |
| **Revision ordering** | Monotonic `u64` revisions. Stale events are rejected without network calls. |
| **Coalescing** | Rapid bursts collapse into at most 2 refreshes. No thundering herd. |
| **Graceful degradation** | Missing BroadcastChannel? No-op. Failed apply? Continue syncing. Every error is reported, nothing crashes. |
| **Tiny footprint** | Core is 3.1 KB gzipped. Each adapter is ~0.8 KB. |
