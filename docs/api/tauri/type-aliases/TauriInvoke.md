[**@statesync/tauri**](../index.md)

***

[@statesync/tauri](../index.md) / TauriInvoke

# Type Alias: TauriInvoke()

```ts
type TauriInvoke = <T>(commandName, args?) => Promise<T>;
```

Defined in: [transport.ts:28](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/tauri/src/transport.ts#L28)

Minimal structural type for Tauri `invoke`.

Consumers can pass:
- `invoke` from `@tauri-apps/api/core`
- or any compatible function (for testing/mocking).

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `commandName` | `string` |
| `args?` | `Record`\<`string`, `unknown`\> |

## Returns

`Promise`\<`T`\>
