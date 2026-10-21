// Checks that every Unsplash photo in the menu loads, and reports the image it resolves to.
// Usage: npm run check:photos
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../src/data/menu.ts', import.meta.url), 'utf8')
const ids = [...source.matchAll(/photo:\s*\{\s*id:\s*'([\w-]+)'/g)].map((m) => m[1])

let failed = 0
for (const id of ids) {
  const url = `https://unsplash.com/photos/${id}/download?w=300`
  try {
    const res = await fetch(url)
    const type = res.headers.get('content-type') ?? ''
    const kb = Math.round(Number(res.headers.get('content-length') ?? 0) / 1024)
    const ok = res.ok && type.startsWith('image/')
    if (!ok) failed++
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${id}  ${res.status} ${type} ${kb ? kb + ' KB' : ''}  ${res.url}`)
  } catch (err) {
    failed++
    console.log(`FAIL ${id}  ${err.message}`)
  }
}
console.log(`\n${ids.length - failed}/${ids.length} photos load.`)
process.exit(failed ? 1 : 0)
