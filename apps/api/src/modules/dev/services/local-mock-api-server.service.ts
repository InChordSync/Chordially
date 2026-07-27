import {
  mockServerConfigSchema,
  type MockServerConfig,
  type MockServerConfigInput,
} from '@chordially/shared';

export class LocalMockApiServerService {
  private config: MockServerConfig;

  constructor(initialOptions?: Partial<MockServerConfigInput>) {
    this.config = mockServerConfigSchema.parse(initialOptions ?? {});
  }

  public enableMockMode(): void {
    this.config.isEnabled = true;
  }

  public getConfig(): MockServerConfig {
    return this.config;
  }
}
