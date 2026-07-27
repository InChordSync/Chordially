import { HorizonAdapterBoundary, type HorizonAccountResponse } from '@chordially/shared';

export class StellarHorizonClientService {
  private readonly adapter = new HorizonAdapterBoundary();

  public async fetchStellarAccountDetails(accountId: string): Promise<HorizonAccountResponse> {
    return this.adapter.getAccountInfo(accountId);
  }
}
