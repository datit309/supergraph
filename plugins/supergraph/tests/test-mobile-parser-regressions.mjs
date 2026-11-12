import assert from 'node:assert/strict'
import test from 'node:test'
import { UiAutomator2TreeParser } from '../src/uiautomator2/parser.js'
import { WdaTreeParser } from '../src/wda/parser.js'

const xml = `<?xml version="1.0"?><hierarchy rotation="0"><node class="android.widget.FrameLayout" bounds="[0,0][100,100]"><node class="android.widget.CheckBox" text="" content-desc="A &amp; B &quot;x&quot; &#65; &#x1F600;" resource-id="demo:id/check" checked="false" bounds="[-10,-20][30,40]" /></node></hierarchy>`
test('native Android XML, wrapped source, entities, checked and signed bounds', () => {
  const parser = new UiAutomator2TreeParser()
  const result = parser.parse({ value: xml })
  assert.equal(result.elements.length, 1)
  assert.equal(result.elements[0].label, 'A & B "x" A 😀')
  assert.equal(result.elements[0].resourceId, 'demo:id/check')
  assert.equal(result.elements[0].checked, false)
  assert.deepEqual(result.elements[0].rect, { x: -10, y: -20, width: 40, height: 60 })
  assert.match(result.text, /checked: false/)
  assert.equal(new UiAutomator2TreeParser().parse(xml).elements.length, 1)
})
test('Appium class-named Android XML nodes are supported', () => {
  const result = new UiAutomator2TreeParser().parse('<hierarchy><android.widget.Button text="Go" bounds="[0,0][20,20]" /></hierarchy>')
  assert.equal(result.elements[0]?.type, 'Button')
})
for (const source of ['', 'not xml', '<hierarchy><node></hierarchy>', '<hierarchy><node /></hierarchy>junk', '<hierarchy text="&bogus;"/>', '<hierarchy><node text="unterminated /></hierarchy>', '<hierarchy/><hierarchy/>', '<hierarchy><node text="a" text="b" /></hierarchy>']) {
  test(`reject malformed Android source ${JSON.stringify(source)}`, () => {
    const parser = new UiAutomator2TreeParser()
    parser.parse(xml)
    assert.throws(() => parser.parse(source), /source|XML/i)
    assert.equal(parser.resolveRef('@e1').label, 'A & B "x" A 😀')
  })
}
for (const [name, Parser, node] of [
  ['Android', UiAutomator2TreeParser, (id, label = id, state = false) => ({ class: 'android.widget.CheckBox', text: label, resourceId: id, checked: state, bounds: '[0,0][20,20]' })],
  ['iOS', WdaTreeParser, (id, label = id, state = '0') => ({ type: 'XCUIElementTypeSwitch', label, name: id, value: String(state), rect: { x: 0, y: 0, width: 20, height: 20 } })],
]) {
  test(`${name} stable refs survive unchanged, insert, remove, state and empty transitions`, () => {
    const parser = new Parser()
    const tree = children => ({ children })
    const first = parser.parse(tree([node('a'), node('b')]))
    const a = first.elements[0].ref, b = first.elements[1].ref
    const same = parser.parse(tree([node('a'), node('b')]), { delta: true })
    assert.equal(parser.resolveRef(a)?.label, 'a')
    assert.equal(same.elements[1].ref, b)
    assert.match(same.text, /no UI changes/)
    const inserted = parser.parse(tree([node('c'), node('a'), node('b')]), { delta: true })
    const c = inserted.elements[0].ref
    assert.notEqual(c, a)
    assert.notEqual(c, b)
    assert.equal(inserted.elements[1].ref, a)
    const changed = parser.parse(tree([node('a', 'renamed', true), node('c')]), { delta: true })
    assert.equal(changed.elements[0].ref, a)
    assert.equal(parser.resolveRef(b), null)
    assert.equal(parser.resolveRef(c)?.label, 'c')
    assert.match(changed.text, /renamed/)
    assert.doesNotMatch(changed.text, /no UI changes/)
    parser.parse(tree([]), { delta: true })
    assert.equal(parser.refMap.size, 0)
    const empty = parser.parse(tree([]), { delta: true })
    assert.equal(empty.isDelta, true)
    const restored = parser.parse(tree([node('d')]), { delta: true })
    assert.ok(![a, b, c].includes(restored.elements[0].ref))
  })
  test(`${name} state-only mutation is reported with existing ref`, () => {
    const parser = new Parser()
    const first = parser.parse({ children: [node('a')] })
    const delta = parser.parse({ children: [node('a', 'a', true)] }, { delta: true })
    assert.equal(delta.elements[0].ref, first.elements[0].ref)
    assert.doesNotMatch(delta.text, /no UI changes/)
    assert.match(delta.text, name === 'Android' ? /checked: true/ : /value: "true"/)
  })
  for (const change of ['remove', 'reorder', 'add']) {
    test(`${name} ambiguous duplicate IDs invalidate old handles on ${change}`, () => {
      const parser = new Parser()
      const alice = node('same', 'Alice'), bob = node('same', 'Bob')
      const initial = change === 'add' ? [alice] : [alice, bob]
      const first = parser.parse({ children: initial })
      const refs = first.elements.map(e => e.ref)
      const next = change === 'remove' ? [bob] : change === 'reorder' ? [bob, alice] : [alice, bob]
      const result = parser.parse({ children: next }, { delta: true })
      for (const ref of refs) {
        assert.equal(parser.resolveRef(ref), null, 'ambiguous old handle must not target another element')
        assert.ok(result.elements.every(e => e.ref !== ref))
      }
    })
  }
  test(`${name} duplicate identifiers retain separate refs`, () => {
    const parser = new Parser()
    const source = { children: [node('same'), node('same')] }
    parser.parse(source)
    const result = parser.parse(source, { delta: true })
    assert.equal(new Set(result.elements.map(e => e.ref)).size, 2)
    assert.equal(parser.refMap.size, 2)
  })
}
