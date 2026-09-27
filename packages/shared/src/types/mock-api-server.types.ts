export interface MockResponseDelayOptions {
  minDelayMs: number;
  maxDelayMs: number;
  simulatedFailureRate: number;
}

export interface MockRouteHandler {
  pathPattern: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  statusCode: number;
  mockResponseBody: Record<string, unknown>;
}

export interface MockServerConfig {
  isEnabled: boolean;
  port: number;
  delayOptions: MockResponseDelayOptions;
  routes: MockRouteHandler[];
}
