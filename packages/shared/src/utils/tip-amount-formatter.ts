export class TipAmountFormatter {
  public static formatCentsToCurrency(cents: number, currency = 'USD'): string {
    const dollars = (cents / 100).toFixed(2);
    const symbol = currency === 'USD' ? '$' : `${currency} `;
    return `${symbol}${dollars}`;
  }
}
