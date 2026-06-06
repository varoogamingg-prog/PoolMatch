export function formatCurrency(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}
