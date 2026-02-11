export function invalidationChannel(topic: string): string {
  return `statesync:${topic}:invalidated`;
}

export function snapshotChannel(topic: string): string {
  return `statesync:${topic}:snapshot`;
}
