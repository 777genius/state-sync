[**@statesync/tauri**](../index.md)

***

[@statesync/tauri](../index.md) / TauriInvoke

# Type Alias: TauriInvoke()

```ts
type TauriInvoke = <T>(commandName, args?) => Promise<T>;
```

Defined in: [transport.ts:69](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/tauri/src/transport.ts#L69)

Minimal structural type matching the Tauri `invoke` function signature.

Accepts any function that:
1. Takes a Tauri command name and an optional args record.
2. Returns a promise resolving to the command's return value.

Consumers can pass:
- `invoke` from `@tauri-apps/api/core` (production)
- A custom stub with the same shape (testing / mocking)

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The return type of the invoked Tauri command. |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `commandName` | `string` |
| `args?` | `Record`\<`string`, `unknown`\> |

## Returns

`Promise`\<`T`\>

## Example

```typescript
import { invoke } from '@tauri-apps/api/core';

// `invoke` satisfies TauriInvoke out of the box:
const tauriInvoke: TauriInvoke = invoke;
```
