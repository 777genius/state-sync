[**@statesync/tauri**](../index.md)

***

[@statesync/tauri](../index.md) / TauriListen

# Type Alias: TauriListen()

```ts
type TauriListen = <T>(eventName, handler) => Promise<Unsubscribe>;
```

Defined in: [transport.ts:16](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/tauri/src/transport.ts#L16)

Minimal structural type for Tauri `listen`.

Consumers can pass:
- `listen` from `@tauri-apps/api/event`
- or any compatible function (for testing/mocking).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `eventName` | `string` |
| `handler` | (`event`) => `void` |

## Returns

`Promise`\<`Unsubscribe`\>
