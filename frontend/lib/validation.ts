export function isValidStellarAddress(value: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(value);
}
