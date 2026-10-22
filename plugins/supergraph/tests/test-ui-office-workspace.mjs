import test from 'node:test'
import assert from 'node:assert/strict'
import { getTeamUiHtml } from '../team/ui-html.js'

test('Supergraph Team UI Virtual Office Workspace Contract', async (t) => {
  const html = getTeamUiHtml()

  await t.test('provides office tab button and container', () => {
    assert.match(html, /id=["']tab-btn-office["']/, 'Should define tab-btn-office button')
    assert.match(html, /id=["']content-office["']/, 'Should define content-office container')
    assert.match(html, /switchTab\(['"]office['"]\)/, 'Should support switchTab to office')
  })

  await t.test('defines office visual components in CSS', () => {
    assert.match(html, /\.office-floor/, 'Should define .office-floor styles')
    assert.match(html, /\.office-desk/, 'Should define .office-desk styles')
    assert.match(html, /\.desk-screen/, 'Should define .desk-screen monitor styles')
    assert.match(html, /\.desk-avatar/, 'Should define .desk-avatar styles')
    assert.match(html, /\.desk-status/, 'Should define .desk-status styles')
  })

  await t.test('includes renderOffice logic in client script', () => {
    assert.match(html, /function\s+renderOffice\s*\(/, 'Should define renderOffice function')
    assert.match(html, /renderOffice\(\)/, 'Should call renderOffice on update or tab switch')
  })

  await t.test('supports interactive workbench modal opening on desk click', () => {
    assert.match(html, /openTaskModal\(/, 'Desk cards should link to openTaskModal')
  })
})
