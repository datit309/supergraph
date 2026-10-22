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

  await t.test('defines ultra-realistic developer workstation SVG with dual screens, keyboard, mouse, and ergonomic chair', () => {
    assert.match(html, /renderTechWorkstationSvg/, 'Should define renderTechWorkstationSvg function')
    assert.match(html, /tech-workstation-svg|\.tech-workstation/, 'Should define tech workstation SVG or container')
    assert.match(html, /screenbar-light|monitor-light-bar|\.screen-bar/, 'Should include ScreenBar monitor light bar')
    assert.match(html, /mechanical-keyboard|custom-keyboard|\.gather-keyboard/, 'Should include mechanical keyboard')
    assert.match(html, /ergonomic-chair|mesh-chair|\.gather-chair/, 'Should include ergonomic mesh chair')
  })

  await t.test('defines architectural interior zones for War Room, QA Lab server rack, and Pantry espresso station', () => {
    assert.match(html, /\.gather-conf-table|\.conf-oval-table/, 'Should define conference table in War Room')
    assert.match(html, /\.gather-server-rack|server-rack-42u|\.rack-cabinet/, 'Should define 42U server rack in QA Lab')
    assert.match(html, /\.gather-bar-counter|espresso-machine|\.pantry-counter/, 'Should define barista espresso station in Pantry')
  })

  await t.test('defines responsive fluid layout and avoids cramped fixed clipping in sidebar frames', () => {
    assert.match(html, /@media[^{]*max-width:\s*960px|@media[^{]*max-width:\s*768px/, 'Should define responsive media query for narrow sidebar viewports')
    assert.match(html, /\.gather-room-eng[\s\S]*?(?:height:\s*auto|min-height)/, 'Engineering room should have auto or min-height without fixed clipping')
    assert.match(html, /\.gather-office[\s\S]*?(?:overflow:\s*auto|overflow-x:\s*auto)/, 'Gather office container should support responsive scrolling')
  })

  await t.test('includes renderOffice logic in client script', () => {
    assert.match(html, /function\s+renderOffice\s*\(/, 'Should define renderOffice function')
    assert.match(html, /renderOffice\(\)/, 'Should call renderOffice on update or tab switch')
  })

  await t.test('supports interactive workbench modal opening on desk click', () => {
    assert.match(html, /openTaskModal\(/, 'Desk cards should link to openTaskModal')
  })

  await t.test('ensures developer avatar figures at workstations are visibly rendered and not hidden by display:none', () => {
    assert.doesNotMatch(html, /\.gather-character\s*\{\s*display:\s*none;?\s*\}/, 'Character avatars must not be globally hidden with display:none')
    assert.match(html, /workstation-human-figure|\.human-avatar-svg/, 'Should define visible human figure at workstation')
  })

  await t.test('supports idle relaxing posture (headphones, coffee sip, chill posture) when worker has no task', () => {
    assert.match(html, /headphone-pulse|headphone-lofi|chill-listening|\.is-relaxing/, 'Should define relaxing animations for idle workers')
    assert.match(html, /chillThought|lofi|nghỉ ngơi|nghe nhạc/i, 'Should provide relaxing thoughts for idle personnel')
  })

  await t.test('renders idle team members relaxing or roaming in the Pantry and Corridors', () => {
    assert.match(html, /gather-roaming-agent|\.roaming-agent-walker/, 'Should define corridor roaming agent walkers')
    assert.match(html, /pantry-lounge-person|\.pantry-seated-agent/, 'Should render seated/relaxing avatars in the Pantry bar')
  })
})
