[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronSnapshotHandlerHandle

# Interface: ElectronSnapshotHandlerHandle

Defined in: [main.ts:192](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/electron/src/main.ts#L192)

Handle returned by [createElectronSnapshotHandler](../functions/createElectronSnapshotHandler.md) for managing the
lifecycle of a snapshot IPC handler.

**Process context:** main process only.

## Properties

### topic

```ts
readonly topic: string;
```

Defined in: [main.ts:194](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/electron/src/main.ts#L194)

The sync topic this handler is bound to.

## Methods

### dispose()

```ts
dispose(): void;
```

Defined in: [main.ts:202](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/electron/src/main.ts#L202)

Removes the `ipcMain.handle()` registration for this topic's snapshot channel.

Call this on app quit or during HMR reload to prevent stale handler errors.
Safe to call multiple times — subsequent calls are no-ops.

#### Returns

`void`
