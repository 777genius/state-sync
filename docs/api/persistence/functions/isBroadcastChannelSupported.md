[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / isBroadcastChannelSupported

# Function: isBroadcastChannelSupported()

```ts
function isBroadcastChannelSupported(): boolean;
```

Defined in: [persistence/src/cross-tab.ts:156](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/cross-tab.ts#L156)

Checks whether the BroadcastChannel API is available in the current environment.

Returns `false` in Node.js, Web Workers without BroadcastChannel support,
and other restricted environments.

## Returns

`boolean`

`true` if `BroadcastChannel` is defined globally.
