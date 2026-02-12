[**@statesync/tauri**](../index.md)

***

[@statesync/tauri](../index.md) / TauriInvalidationSubscriberOptions

# Interface: TauriInvalidationSubscriberOptions

Defined in: [transport.ts:74](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/tauri/src/transport.ts#L74)

Configuration for [createTauriInvalidationSubscriber](../functions/createTauriInvalidationSubscriber.md).

## Properties

### eventName

```ts
eventName: string;
```

Defined in: [transport.ts:92](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/tauri/src/transport.ts#L92)

The Tauri event name to listen on.

Must match the event name used by the Rust backend when calling
`app.emit("event-name", payload)` or `window.emit("event-name", payload)`.

#### Example

```ts
`'state-sync:invalidation'`
```

***

### listen

```ts
listen: TauriListen;
```

Defined in: [transport.ts:82](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/tauri/src/transport.ts#L82)

A Tauri-compatible `listen` function used to subscribe to backend events.

The function is called once with `eventName` and an internal handler.
The Rust backend is expected to emit events on this channel whose payload
is an InvalidationEvent-shaped object (at minimum `{ topic, revision }`).
