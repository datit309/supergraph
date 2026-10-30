import assert from 'node:assert'
import { UiAutomator2TreeParser } from '../src/uiautomator2/parser.js'
import { UiAutomator2Client } from '../src/uiautomator2/client.js'

console.log('Testing UiAutomator2TreeParser and UiAutomator2Client...')

// 1. Mock UiAutomator2 JSON Source Tree (W3C / UiAutomator2 structure)
const mockAndroidSourceTree = {
  value: {
    class: 'android.widget.FrameLayout',
    package: 'com.example.android.demo',
    bounds: '[0,0][1080,2400]',
    children: [
      {
        class: 'android.widget.LinearLayout',
        package: 'com.example.android.demo',
        bounds: '[0,0][1080,2400]',
        children: [
          // Noise layout to filter out
          {
            class: 'android.view.ViewGroup',
            bounds: '[0,0][1080,200]',
            children: []
          },
          // Screen Title
          {
            class: 'android.widget.TextView',
            text: 'Đăng nhập hệ thống',
            resourceId: 'com.example.android.demo:id/tv_title',
            bounds: '[100,300][980,400]',
            ELEMENT: 'android-elem-title-01'
          },
          // Username Input
          {
            class: 'android.widget.EditText',
            text: 'admin@domain.com',
            resourceId: 'com.example.android.demo:id/edt_username',
            contentDesc: 'Tên đăng nhập',
            bounds: '[100,450][980,600]',
            ELEMENT: 'android-elem-user-02'
          },
          // Password Input
          {
            class: 'android.widget.EditText',
            text: '••••••••',
            resourceId: 'com.example.android.demo:id/edt_password',
            contentDesc: 'Mật khẩu',
            bounds: '[100,650][980,800]',
            ELEMENT: 'android-elem-pass-03'
          },
          // Login Button
          {
            class: 'android.widget.Button',
            text: 'Đăng nhập',
            resourceId: 'com.example.android.demo:id/btn_login',
            bounds: '[100,850][980,1000]',
            ELEMENT: 'android-elem-btn-04'
          },
          // Remember Me CheckBox
          {
            class: 'android.widget.CheckBox',
            text: 'Ghi nhớ đăng nhập',
            resourceId: 'com.example.android.demo:id/cb_remember',
            checked: true,
            bounds: '[100,1050][500,1150]',
            ELEMENT: 'android-elem-cb-05'
          },
          // Invisible / zero-sized element
          {
            class: 'android.widget.Button',
            text: 'Hidden action',
            bounds: '[0,0][0,0]',
            ELEMENT: 'android-elem-hidden-06'
          }
        ]
      }
    ]
  }
}

// 2. Test Parser
const parser = new UiAutomator2TreeParser()
const parsed = parser.parse(mockAndroidSourceTree, { appPackage: 'com.example.android.demo' })

assert.ok(parsed.text.includes('@e1'), 'Must assign @e1 reference')
assert.ok(parsed.text.includes('Đăng nhập hệ thống'), 'Must include title text')
assert.ok(parsed.text.includes('TextField'), 'Must normalize EditText to TextField')
assert.ok(parsed.text.includes('Button'), 'Must detect Button')
assert.ok(parsed.text.includes('CheckBox'), 'Must detect CheckBox')
assert.ok(!parsed.text.includes('Hidden action'), 'Must filter out zero-dimension elements')
assert.strictEqual(parsed.elements.length, 5, `Expected 5 compact elements, got ${parsed.elements.length}`)

// Verify ref lookup & center calculation
const btnRef = parser.resolveRef('@e4') // Button is 4th element
assert.ok(btnRef, 'Must resolve @e4')
assert.strictEqual(btnRef.label, 'Đăng nhập')
assert.strictEqual(btnRef.elementId, 'android-elem-btn-04')
// Bounds [100,850][980,1000]: width=880, height=150 -> center x = 100+440=540, y = 850+75=925
assert.strictEqual(btnRef.center.x, 540)
assert.strictEqual(btnRef.center.y, 925)

// 3. Test Delta Snapshot
const updatedTree = JSON.parse(JSON.stringify(mockAndroidSourceTree))
const container = updatedTree.value.children[0].children
container.splice(4, 1) // Remove login button
container.push({
  class: 'android.widget.TextView',
  text: 'Xác thực thành công!',
  resourceId: 'com.example.android.demo:id/tv_success',
  bounds: '[100,850][980,1000]',
  ELEMENT: 'android-elem-success-07'
})

const deltaResult = parser.parse(updatedTree, { delta: true })
assert.ok(deltaResult.isDelta, 'Must mark result as delta')
assert.ok(deltaResult.text.includes('[StaticText] "Xác thực thành công!"'), 'Delta must include newly added element')
assert.ok(deltaResult.text.includes('- [Button] "Đăng nhập"'), 'Delta must indicate removed element')

// 4. Test UiAutomator2Client
const client = new UiAutomator2Client({ baseUrl: 'http://127.0.0.1:6790' })
assert.strictEqual(client.baseUrl, 'http://127.0.0.1:6790')

console.log('✔ All UiAutomator2TreeParser and UiAutomator2Client unit tests passed!')
