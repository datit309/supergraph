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

  await t.test('defines 2.5D isometric architectural office layout and 3D elevation styles', () => {
    assert.match(html, /\.iso-scene/, 'Should define .iso-scene 3D perspective wrapper')
    assert.match(html, /\.iso-stage/, 'Should define .iso-stage 3D transformed container')
    assert.match(html, /\.iso-workstation/, 'Should define .iso-workstation for 2.5D desks')
    assert.match(html, /\.iso-screen-3d/, 'Should define .iso-screen-3d for elevated monitors')
    assert.match(html, /\.iso-person-3d/, 'Should define .iso-person-3d for isometric avatars')
    assert.match(html, /transform-style:\s*preserve-3d/, 'Should use CSS preserve-3d for true 2.5D depth')
    assert.match(html, /id=["']btn-view-iso["']/, 'Should define btn-view-iso toggle button')
    assert.match(html, /setOfficeView\(['"]iso['"]\)/, 'Should support setOfficeView to iso')
  })

  await t.test('defines Gather.town style 2.5D RPG 3/4 layout and pixel/isometric office styles', () => {
    assert.match(html, /\.gather-office/, 'Should define .gather-office main container')
    assert.match(html, /\.gather-room/, 'Should define .gather-room for 3/4 oblique rooms')
    assert.match(html, /\.gather-desk/, 'Should define .gather-desk for front-facing wooden desks with 3/4 depth')
    assert.match(html, /\.gather-character/, 'Should define .gather-character for front-facing avatars')
    assert.match(html, /\.gather-monitor/, 'Should define .gather-monitor for dual forward-facing monitors')
    assert.match(html, /id=["']btn-view-gather["']/, 'Should define btn-view-gather toggle button')
    assert.match(html, /setOfficeView\(['"]gather['"]\)/, 'Should support setOfficeView to gather')
  })

  await t.test('defines realistic human illustrated avatars with hair, face, clothes, and animated typing hands', () => {
    assert.match(html, /renderHumanDeveloperSvg/, 'Should define renderHumanDeveloperSvg function')
    assert.match(html, /\.human-avatar-svg/, 'Should define .human-avatar-svg styles')
    assert.match(html, /human-character-container|\.human-avatar-wrapper/, 'Should define human avatar container')
    assert.match(html, /@keyframes\s+typing-arm|@keyframes\s+type-hands|\.hands-typing|\.typing-hands-anim/, 'Should define animated typing hands')
  })

  await t.test('includes renderOffice logic in client script', () => {
    assert.match(html, /function\s+renderOffice\s*\(/, 'Should define renderOffice function')
    assert.match(html, /renderOffice\(\)/, 'Should call renderOffice on update or tab switch')
  })

  await t.test('supports interactive workbench modal opening on desk click', () => {
    assert.match(html, /openTaskModal\(/, 'Desk cards should link to openTaskModal')
  })
})
