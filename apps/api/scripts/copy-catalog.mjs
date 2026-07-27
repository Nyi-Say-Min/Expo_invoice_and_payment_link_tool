import { copyFile, mkdir } from 'node:fs/promises'

await mkdir(new URL('../dist/data/', import.meta.url), { recursive: true })
await copyFile(
  new URL('../src/data/trunov_price_list.csv', import.meta.url),
  new URL('../dist/data/trunov_price_list.csv', import.meta.url),
)
