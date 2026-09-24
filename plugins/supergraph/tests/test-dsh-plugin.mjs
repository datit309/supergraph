import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { name, inject, apply } from '../index.js'

// 1. Verify plugin metadata exports
assert.strictEqual(name, 'supergraph', 'Plugin name must be "supergraph"')
assert.deepStrictEqual(inject, ['skills'], 'Plugin must inject ["skills"]')
assert.strictEqual(typeof apply, 'function', 'Plugin must export apply()')

// 2. Verify package.json bundle declaration
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
assert.strictEqual(pkg.name, 'supergraph')
assert.strictEqual(pkg.dsh?.manifestVersion, 1)
assert.strictEqual(pkg.dsh?.bundle?.patch, './cordis.patch.yml')

// 3. Verify mock DSH context registration
let registeredProvider = null
const mockCtx = {
  skills: {
    registerProvider(fn) {
      registeredProvider = fn({ signal: new AbortController().signal, invalidate() {} })
    }
  },
  systemPrompt: {
    section(sec) {
      assert.strictEqual(sec.name, 'supergraph:workflow')
    }
  }
}

apply(mockCtx)
assert.ok(registeredProvider, 'Provider must be registered on ctx.skills')
assert.strictEqual(registeredProvider.name, 'supergraph')

// 4. Verify skill listing
const candidates = await registeredProvider.list()
assert.ok(candidates.length >= 30, `Expected >= 30 skills, got ${candidates.length}`)

const scanSkill = candidates.find(s => s.name === 'scan')
assert.ok(scanSkill, 'Should include "scan" skill')
assert.strictEqual(scanSkill.provider, 'supergraph')
assert.ok(scanSkill.description.length > 0, 'Scan skill must have description')

// 5. Verify skill content retrieval
const loaded = await registeredProvider.get(scanSkill)
assert.strictEqual(loaded.name, 'scan')
assert.ok(loaded.content.includes('/supergraph:scan'), 'Loaded content must contain skill body')

console.log(`Self-check passed: ${candidates.length} Supergraph skills loaded successfully for DSH.`)
