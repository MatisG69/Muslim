export const orderedPair = (a: string, b: string): [string, string] =>
  a < b ? [a, b] : [b, a]
