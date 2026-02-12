[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronBroadcasterHandle

# Interface: ElectronBroadcasterHandle

Defined in: [main.ts:54](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/main.ts#L54)

Handle returned by [createElectronBroadcaster](../functions/createElectronBroadcaster.md) for sending
invalidation events to renderer processes.

**Process context:** main process only.

## Properties

### topic

```ts
readonly topic: string;
```

Defined in: [main.ts:56](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/main.ts#L56)

The sync topic this broadcaster is bound to.

## Methods

### invalidate()

```ts
invalidate(revision, extra?): void;
```

Defined in: [main.ts:69](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/main.ts#L69)

Broadcasts an invalidation event to all target renderer windows.

Each target is guarded with `isDestroyed()` and a `try/catch` to handle
the TOCTOU race inherent in Electron multi-window apps (a `webContents`
can be destroyed between the check and the `send()` call).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `revision` | `string` | The new revision string to broadcast. |
| `extra?` | \{ `sourceId?`: `string`; \} | Optional additional fields for the InvalidationEvent. |
| `extra.sourceId?` | `string` | Identifier of the source that produced this revision change. |

#### Returns

`void`
