// TypeScript type for FX Node (minimal, for typing only)
export interface FxNode {
  wrap: () => unknown;
  expand: (data: unknown) => FxNode;
  [key: string]: any;
}
