import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const root = new URL('../../../', import.meta.url)
for (const file of ['.dsh-plugin/cordis.patch.yml', 'plugins/supergraph/cordis.patch.yml', 'plugins/supergraph/.dsh-plugin/cordis.patch.yml']) {
  test(`${file} registers both native mobile MCP backends`, () => {
    const source = readFileSync(new URL(file, root), 'utf8')
    for (const [server, binary] of [['supergraph-wda', 'sg-wda-mcp.js'], ['supergraph-uiautomator2', 'sg-uiautomator2-mcp.js']]) {
      assert.ok(source.includes(`serverName: ${server}`), `Missing ${server}`)
      assert.ok(source.includes(binary), `Missing ${binary}`)
    }
  })
}
