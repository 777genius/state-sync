[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / RevisionSyncHandle

# Interface: RevisionSyncHandle

Defined in: [engine.ts:36](https://github.com/777genius/state-sync/blob/bb3d0421376fc001c246959375069b16c35e1e84/packages/core/src/engine.ts#L36)

## Methods

### getLocalRevision()

```ts
getLocalRevision(): Revision;
```

Defined in: [engine.ts:40](https://github.com/777genius/state-sync/blob/bb3d0421376fc001c246959375069b16c35e1e84/packages/core/src/engine.ts#L40)

#### Returns

[`Revision`](../type-aliases/Revision.md)

***

### refresh()

```ts
refresh(): Promise<void>;
```

Defined in: [engine.ts:39](https://github.com/777genius/state-sync/blob/bb3d0421376fc001c246959375069b16c35e1e84/packages/core/src/engine.ts#L39)

#### Returns

`Promise`\<`void`\>

***

### start()

```ts
start(): Promise<void>;
```

Defined in: [engine.ts:37](https://github.com/777genius/state-sync/blob/bb3d0421376fc001c246959375069b16c35e1e84/packages/core/src/engine.ts#L37)

#### Returns

`Promise`\<`void`\>

***

### stop()

```ts
stop(): void;
```

Defined in: [engine.ts:38](https://github.com/777genius/state-sync/blob/bb3d0421376fc001c246959375069b16c35e1e84/packages/core/src/engine.ts#L38)

#### Returns

`void`
