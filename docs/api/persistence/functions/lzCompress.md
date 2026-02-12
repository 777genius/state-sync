[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / lzCompress

# Function: lzCompress()

```ts
function lzCompress(input): string;
```

Defined in: [persistence/src/compression.ts:32](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/compression.ts#L32)

Compress a string using a built-in LZW-based algorithm.

The output is a UTF-16 safe string suitable for direct storage in
localStorage or any string-based backend. The dictionary size is capped
at 0xFFFE entries to stay within the BMP (Basic Multilingual Plane).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `input` | `string` | The raw string to compress. Returns an empty string if input is falsy. |

## Returns

`string`

The compressed string representation.

## Example

```typescript
const compressed = lzCompress(JSON.stringify(myState));
const restored = JSON.parse(lzDecompress(compressed));
```
