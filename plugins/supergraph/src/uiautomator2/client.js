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

      if (!res.ok) {
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

    const res = await this.request('/session', { method: 'POST', body })
    this.sessionId = res.sessionId || res.value?.sessionId
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

  async source(format = 'json') {
    const sessionPrefix = this.sessionId ? `/session/${this.sessionId}` : ''
    return this.request(`${sessionPrefix}/source?format=${format}`)
  }

  async screenshot() {
    const res = await this.request('/screenshot')
    return res.value // Base64 string
  }

  async tap(x, y) {
    if (!this.sessionId) throw new Error('No active UiAutomator2 session.')
    return this.request(`/session/${this.sessionId}/appium/tap`, {
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
    return this.request(`/session/${this.sessionId}/element/${elementId}/value`, {
      method: 'POST',
      body: { text: String(text) },
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
    return this.request(`/session/${this.sessionId}/appium/device/hide_keyboard`, {
      method: 'POST',
      body: {},
    }).catch(() => null)
  }

  async swipe(fromX, fromY, toX, toY, steps = 20) {
    if (!this.sessionId) throw new Error('No active UiAutomator2 session.')
    // UiAutomator2 supports drag/swipe actions
    const body = {
      startX: Math.round(fromX),
      startY: Math.round(fromY),
      endX: Math.round(toX),
      endY: Math.round(toY),
      steps: Math.max(5, Math.round(steps)),
    }
    return this.request(`/session/${this.sessionId}/touch/perform`, {
      method: 'POST',
      body: {
        actions: [
          { action: 'press', options: { x: body.startX, y: body.startY } },
          { action: 'wait', options: { ms: 100 } },
          { action: 'moveTo', options: { x: body.endX, y: body.endY } },
          { action: 'release', options: {} },
        ],
      },
    }).catch(() => {
      // Fallback to drag endpoint if available
      return this.request(`/session/${this.sessionId}/appium/device/drag`, { method: 'POST', body })
    })
  }

  async activateApp(appId) {
    if (!this.sessionId) throw new Error('No active UiAutomator2 session.')
    return this.request(`/session/${this.sessionId}/appium/device/activate_app`, {
      method: 'POST',
      body: { appId },
    })
  }

  async terminateApp(appId) {
    if (!this.sessionId) throw new Error('No active UiAutomator2 session.')
    return this.request(`/session/${this.sessionId}/appium/device/terminate_app`, {
      method: 'POST',
      body: { appId },
    })
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
    return this.request(`/session/${this.sessionId}/url`, {
      method: 'POST',
      body: { url },
    })
  }
}
