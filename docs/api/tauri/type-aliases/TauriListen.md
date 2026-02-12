[**@statesync/tauri**](../index.md)

***

[@statesync/tauri](../index.md) / TauriListen

# Type Alias: TauriListen()

```ts
type TauriListen = <T>(eventName, handler) => Promise<Unsubscribe>;
```

Defined in: [transport.ts:43](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/tauri/src/transport.ts#L43)

Minimal structural type matching the Tauri `listen` function signature.

Accepts any function that:
1. Takes an event name and a handler callback.
2. Returns a promise that resolves to an Unsubscribe teardown function.

Consumers can pass:
- `listen` from `@tauri-apps/api/event` (production)
- A custom stub with the same shape (testing / mocking)

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `T` | `unknown` | The payload type carried by the Tauri event. Defaults to `unknown`. |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `eventName` | `string` |
| `handler` | (`event`) => `void` |

## Returns

`Promise`\<`Unsubscribe`\>

## Example

```typescript
import { listen } from '@tauri-apps/api/event';

// `listen` satisfies TauriListen out of the box:
const tauriListen: TauriListen = listen;
```
