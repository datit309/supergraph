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

  await t.test('defines 2D architectural floorplan layout and corridor styles', () => {
    assert.match(html, /\.floorplan-container/, 'Should define .floorplan-container for 2D architectural map')
    assert.match(html, /\.floorplan-hallway/, 'Should define .floorplan-hallway for office corridors')
    assert.match(html, /\.floorplan-workstation/, 'Should define .floorplan-workstation for 2D desks')
    assert.match(html, /\.floorplan-person/, 'Should define .floorplan-person for top-down avatars')
    assert.match(html, /\.floorplan-meeting-room/, 'Should define .floorplan-meeting-room for War Room')
    assert.match(html, /\.floorplan-pantry/, 'Should define .floorplan-pantry for coffee & lounge area')
    assert.match(html, /@keyframes\s+walk-corridor|\.walking-agent/, 'Should define walking animation for personnel on corridors')
  })

  await t.test('includes renderOffice logic in client script', () => {
    assert.match(html, /function\s+renderOffice\s*\(/, 'Should define renderOffice function')
    assert.match(html, /renderOffice\(\)/, 'Should call renderOffice on update or tab switch')
  })

  await t.test('supports interactive workbench modal opening on desk click', () => {
    assert.match(html, /openTaskModal\(/, 'Desk cards should link to openTaskModal')
  })
})
