import test from 'node:test'
import assert from 'node:assert/strict'
import { getTeamUiHtml } from '../team/ui-html.js'

test('Supergraph Team UI Light Mode Contract', async (t) => {
  const html = getTeamUiHtml()

  await t.test('has light mode as default theme attributes or styles', () => {
    // Should have data-theme or root variables calibrated for light mode
    assert.match(html, /--bg:\s*(#f8fafc|#ffffff|#f1f5f9)/i, 'Should define light background variable')
    assert.match(html, /--text:\s*(#0f172a|#1e293b|#111827|#334155)/i, 'Should define dark slate text for light mode')
    assert.match(html, /--card-bg:\s*(#ffffff|#f8fafc)/i, 'Should define white/light card background')
    assert.match(html, /--card-border:\s*(#e2e8f0|#cbd5e1)/i, 'Should define subtle slate border')
  })

  await t.test('provides dark mode overrides via [data-theme="dark"]', () => {
    assert.match(html, /\[data-theme=["']?dark["']?\]/, 'Should support dark mode overrides')
  })

  await t.test('provides theme toggle button in header', () => {
    assert.match(html, /id=["']theme-toggle["']|onclick=["'](?:toggleTheme|switchTheme)\(\)["']/, 'Should have theme toggle button')
  })

  await t.test('includes theme persistence and URL parameter logic', () => {
    assert.match(html, /localStorage\.(?:getItem|setItem)\(['"](?:sg_theme|sg_team_theme)['"]\)/, 'Should persist theme in localStorage')
    assert.match(html, /urlParams\.get\(["']theme["']\)/, 'Should support URL theme parameter')
  })
})
