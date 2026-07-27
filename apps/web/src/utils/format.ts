export function money(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

export function unitLabel(unit: string) {
  return ({
    pack_100pcs: '100 pcs',
    pack_20pcs: '20 pcs',
    per_100g: 'per 100 g',
    per_kg: 'per kg',
    pack: 'pack',
  } as Record<string, string>)[unit] ?? unit
}
