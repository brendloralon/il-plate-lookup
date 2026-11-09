export interface FixtureRequest {
  resourceId: string;
  filters: Record<string, unknown>;
  status: number;
  body: unknown;
}

export interface Fixture {
  plate: string;
  recordedAt: string;
  requests: FixtureRequest[];
}
