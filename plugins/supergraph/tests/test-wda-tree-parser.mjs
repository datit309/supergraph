import assert from 'node:assert'
import { WdaTreeParser } from '../src/wda/parser.js'
import { WdaClient } from '../src/wda/client.js'

console.log('Testing WdaTreeParser and WdaClient...')

// 1. Mock WDA JSON Accessibility Tree
const mockSourceTree = {
  value: {
    type: 'XCUIElementTypeApplication',
    name: 'DemoApp',
    label: 'DemoApp',
    rect: { x: 0, y: 0, width: 393, height: 852 },
    children: [
      {
        type: 'XCUIElementTypeWindow',
        name: null,
        label: null,
        rect: { x: 0, y: 0, width: 393, height: 852 },
        children: [
          {
            type: 'XCUIElementTypeOther',
            name: null,
            label: null,
            rect: { x: 0, y: 0, width: 393, height: 852 },
            children: [
              // Noise container to filter out
              {
                type: 'XCUIElementTypeOther',
                name: null,
                label: null,
                rect: { x: 0, y: 0, width: 393, height: 100 },
                children: []
              },
              // Title text
              {
                type: 'XCUIElementTypeStaticText',
                name: 'welcome_title',
                label: 'Chào mừng đăng nhập',
                value: 'Chào mừng đăng nhập',
                rect: { x: 40, y: 120, width: 313, height: 32 },
                ELEMENT: 'elem-title-01'
              },
              // Username input
              {
                type: 'XCUIElementTypeTextField',
                name: 'username_input',
                label: 'Tên người dùng',
                value: 'user@example.com',
                rect: { x: 40, y: 200, width: 313, height: 44 },
                ELEMENT: 'elem-user-02'
              },
              // Password input
              {
                type: 'XCUIElementTypeSecureTextField',
                name: 'password_input',
                label: 'Mật khẩu',
                value: '••••••••',
                rect: { x: 40, y: 260, width: 313, height: 44 },
                ELEMENT: 'elem-pass-03'
              },
              // Login button
              {
                type: 'XCUIElementTypeButton',
                name: 'login_btn',
                label: 'Đăng nhập',
                rect: { x: 40, y: 340, width: 313, height: 50 },
                ELEMENT: 'elem-btn-04'
              },
              // Remember Me Switch
              {
                type: 'XCUIElementTypeSwitch',
                name: 'remember_switch',
                label: 'Ghi nhớ đăng nhập',
                value: '1',
                rect: { x: 40, y: 410, width: 51, height: 31 },
                ELEMENT: 'elem-switch-05'
              },
              // Invisible element (off-screen or zero size - should be ignored)
              {
                type: 'XCUIElementTypeButton',
                name: 'hidden_btn',
                label: 'Hidden Action',
                rect: { x: 0, y: 0, width: 0, height: 0 },
                ELEMENT: 'elem-hidden-06'
              }
            ]
          }
        ]
      }
    ]
  }
}

// 2. Test Compact Tree Parser
const parser = new WdaTreeParser()
const parsed = parser.parse(mockSourceTree, { appBundle: 'com.example.demo' })

assert.ok(parsed.text.includes('@e1'), 'Must assign @e1 reference')
assert.ok(parsed.text.includes('Chào mừng đăng nhập'), 'Must include static title text')
assert.ok(parsed.text.includes('TextField'), 'Must detect TextField')
assert.ok(parsed.text.includes('SecureTextField'), 'Must detect SecureTextField')
assert.ok(parsed.text.includes('Button'), 'Must detect Button')
assert.ok(parsed.text.includes('Switch'), 'Must detect Switch')
assert.ok(!parsed.text.includes('Hidden Action'), 'Must filter out zero-dimension/hidden elements')
assert.ok(parsed.elements.length === 5, `Expected 5 compact elements, got ${parsed.elements.length}`)

// Verify ref lookup & center calculation
const btnRef = parser.resolveRef('@e4') // Button is 4th element
assert.ok(btnRef, 'Must resolve @e4')
assert.strictEqual(btnRef.label, 'Đăng nhập')
assert.strictEqual(btnRef.elementId, 'elem-btn-04')
// Center should be: x=40+313/2 = 196.5, y=340+50/2 = 365
assert.strictEqual(btnRef.center.x, 196.5)
assert.strictEqual(btnRef.center.y, 365)

// 3. Test Delta Snapshot
const updatedTree = JSON.parse(JSON.stringify(mockSourceTree))
// Remove login button and add loading spinner + success text
const container = updatedTree.value.children[0].children[0].children
container.splice(4, 1) // Remove button
container.push({
  type: 'XCUIElementTypeStaticText',
  name: 'success_msg',
  label: 'Đăng nhập thành công!',
  value: 'Đăng nhập thành công!',
  rect: { x: 40, y: 350, width: 313, height: 40 },
  ELEMENT: 'elem-success-07'
})

const deltaResult = parser.parse(updatedTree, { delta: true })
assert.ok(deltaResult.isDelta, 'Must mark result as delta')
assert.ok(deltaResult.text.includes('[StaticText] "Đăng nhập thành công!"'), 'Delta must include newly added element')
assert.ok(deltaResult.text.includes('- [Button] "Đăng nhập"'), 'Delta must indicate removed element')

// 4. Test WdaClient formatters
const client = new WdaClient({ baseUrl: 'http://127.0.0.1:8100' })
assert.strictEqual(client.baseUrl, 'http://127.0.0.1:8100')

console.log('✔ All WdaTreeParser and WdaClient unit tests passed!')
