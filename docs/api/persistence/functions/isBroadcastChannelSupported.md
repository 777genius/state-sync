[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / isBroadcastChannelSupported

# Function: isBroadcastChannelSupported()

```ts
function isBroadcastChannelSupported(): boolean;
```

Defined in: [persistence/src/cross-tab.ts:156](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/cross-tab.ts#L156)

Checks whether the BroadcastChannel API is available in the current environment.

Returns `false` in Node.js, Web Workers without BroadcastChannel support,
and other restricted environments.

## Returns

`boolean`

`true` if `BroadcastChannel` is defined globally.
