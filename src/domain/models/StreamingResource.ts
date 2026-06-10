export const STREAMING_RESOURCES = [
  "fantasypros",
  "pitcherlist",
  "dailywaivers",
] as const;

export type StreamingResource = (typeof STREAMING_RESOURCES)[number];
