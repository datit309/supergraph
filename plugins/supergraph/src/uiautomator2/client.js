/**
 * Direct Lightweight HTTP REST Client for Appium UiAutomator2 Server (Android).
 * Bypasses the heavy Appium Server middleware to communicate directly with port 6790.
 */

export class UiAutomator2Client {
  constructor(options = {}) {
    this.baseUrl = (options.baseUrl || process.env.UIAUTOMATOR2_URL || 'http://127.0.0.1:6790').replace(/\/$/, '')
    this.sessionId = options.sessionId || null
    this.timeout = options.timeout || 15000
  }

  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeout)

    try {
      const fetchOptions = {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(options.headers || {}),
        },
        signal: controller.signal,
      }

      if (options.body) {
        fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body)
      }

      const res = await fetch(url, fetchOptions)
      const data = await res.json().catch(() => null)

      if (!res.ok || data?.value?.error || (typeof data?.status === 'number' && data.status !== 0)) {
        const errorMsg = data?.value?.message || data?.message || `HTTP ${res.status} ${res.statusText}`
        throw new Error(`UiAutomator2 Request failed (${path}): ${errorMsg}`)
      }

      return data
    } finally {
      clearTimeout(timer)
    }
  }

  async status() {
    return this.request('/status')
  }

  async createSession(appPackage, capabilities = {}) {
    const body = {
      capabilities: {
        alwaysMatch: {
          appPackage,
          ...capabilities,
        },
      },
    }

    this.sessionId = null
    const res = await this.request('/session', { method: 'POST', body })
    const sessionId = res?.sessionId || res?.value?.sessionId
    if (typeof sessionId !== 'string' || !sessionId.trim()) {
      throw new Error('UiAutomator2 session creation returned no valid session id.')
    }
    this.sessionId = sessionId
    return res
  }

  async deleteSession() {
    if (!this.sessionId) return null
    try {
      const res = await this.request(`/session/${this.sessionId}`, { method: 'DELETE' })
      return res
    } finally {
      this.sessionId = null
    }
  }

  async source() {
    if (!this.sessionId) throw new Error('No active UiAutomator2 session.')
    return this.request(`/session/${this.sessionId}/source`)
  }

  async windowSize() {
    if (!this.sessionId) throw new Error('No active UiAutomator2 session.')
    return this.request(`/session/${this.sessionId}/window/current/size`)
  }

  async screenshot() {
    if (!this.sessionId) throw new Error('No active UiAutomator2 session.')
    const res = await this.request(`/session/${this.sessionId}/screenshot`)
    return res.value // Base64 string
  }

  async tap(x, y) {
    if (!this.sessionId) throw new Error('No active UiAutomator2 session.')
    return this.request(`/session/${this.sessionId}/appium/gestures/click`, {
      method: 'POST',
      body: { x: Math.round(x), y: Math.round(y) },
    })
  }

  async tapElement(elementId) {
    if (!this.sessionId) throw new Error('No active UiAutomator2 session.')
    return this.request(`/session/${this.sessionId}/element/${elementId}/click`, {
      method: 'POST',
      body: {},
    })
  }

  async fill(elementId, text) {
    if (!this.sessionId) throw new Error('No active UiAutomator2 session.')
    const target = elementId == null ? 'keys' : `element/${elementId}/value`
    return this.request(`/session/${this.sessionId}/${target}`, {
      method: 'POST',
      body: { text: String(text), replace: true },
    })
  }

  async pressKeyCode(keyCode, metastate = 0, flags = 0) {
    if (!this.sessionId) throw new Error('No active UiAutomator2 session.')
    return this.request(`/session/${this.sessionId}/appium/device/press_keycode`, {
      method: 'POST',
      body: { keycode: Number(keyCode), metastate, flags },
    })
  }

  async hideKeyboard() {
    if (!this.sessionId) throw new Error('No active UiAutomator2 session.')
    throw new Error('hideKeyboard is not supported by the direct UiAutomator2 server; use Appium middleware or an explicit keycode.')
  }

  async swipe(fromX, fromY, toX, toY, steps = 20) {
    if (!this.sessionId) throw new Error('No active UiAutomator2 session.')
    return this.request(`/session/${this.sessionId}/actions`, {
      method: 'POST',
      body: {
        actions: [{
          type: 'pointer',
          id: 'finger',
          parameters: { pointerType: 'touch' },
          actions: [
            { type: 'pointerMove', duration: 0, origin: 'viewport', x: Math.round(fromX), y: Math.round(fromY) },
            { type: 'pointerDown', button: 0 },
            { type: 'pause', duration: 100 },
            { type: 'pointerMove', duration: Math.max(5, Math.round(steps)) * 5, origin: 'viewport', x: Math.round(toX), y: Math.round(toY) },
            { type: 'pointerUp', button: 0 },
          ],
        }],
      },
    })
  }

  async activateApp(appId) {
    if (!this.sessionId) throw new Error('No active UiAutomator2 session.')
    throw new Error('activateApp is not supported by the direct UiAutomator2 server; use Appium middleware or ADB.')
  }

  async terminateApp(appId) {
    if (!this.sessionId) throw new Error('No active UiAutomator2 session.')
    throw new Error('terminateApp is not supported by the direct UiAutomator2 server; use Appium middleware or ADB.')
  }

  async alertText() {
    if (!this.sessionId) throw new Error('No active UiAutomator2 session.')
    return this.request(`/session/${this.sessionId}/alert/text`)
  }

  async alertAccept() {
    if (!this.sessionId) throw new Error('No active UiAutomator2 session.')
    return this.request(`/session/${this.sessionId}/alert/accept`, { method: 'POST', body: {} })
  }

  async alertDismiss() {
    if (!this.sessionId) throw new Error('No active UiAutomator2 session.')
    return this.request(`/session/${this.sessionId}/alert/dismiss`, { method: 'POST', body: {} })
  }

  async openUrl(url) {
    if (!this.sessionId) throw new Error('No active UiAutomator2 session.')
    throw new Error('openUrl is not supported by the direct UiAutomator2 server; use Appium middleware or ADB.')
  }
}
